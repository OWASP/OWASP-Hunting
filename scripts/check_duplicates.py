#!/usr/bin/env python3
"""Check pull request additions for duplicate payload/content entries."""

from __future__ import annotations

import base64
import difflib
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


COMMENT_PREFIXES = ("#",)
TEXT_FILE_SIZE_LIMIT = 2 * 1024 * 1024
PAYLOAD_EXTENSIONS = {".txt"}


@dataclass(frozen=True)
class Entry:
    text: str
    strict_key: str
    ws_key: str


@dataclass(frozen=True)
class Location:
    path: str
    line: int
    text: str


@dataclass(frozen=True)
class Duplicate:
    kind: str
    entry: str
    existing: Location
    new: Location


def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def ws_key_for(line: str) -> str:
    return re.sub(r"[\t \f\v]+", " ", line).strip()


def to_entry(line: str) -> Optional[Entry]:
    stripped = line.strip()
    if not stripped:
        return None
    if any(stripped.startswith(prefix) for prefix in COMMENT_PREFIXES):
        return None
    return Entry(text=stripped, strict_key=stripped, ws_key=ws_key_for(stripped))


def extract_entries_from_text(text: str) -> List[Tuple[Entry, int]]:
    out: List[Tuple[Entry, int]] = []
    for idx, line in enumerate(normalize_newlines(text).split("\n"), start=1):
        entry = to_entry(line)
        if entry:
            out.append((entry, idx))
    return out


def parse_patch_line_changes(patch: str) -> Tuple[List[str], List[str]]:
    added: List[str] = []
    removed: List[str] = []
    for line in patch.splitlines():
        if line.startswith("+++") or line.startswith("---") or line.startswith("@@"):
            continue
        if line.startswith("+"):
            added.append(line[1:])
        elif line.startswith("-"):
            removed.append(line[1:])
    return added, removed


def parse_full_diff_changes(base_text: str, head_text: str) -> Tuple[List[str], List[str]]:
    base_lines = normalize_newlines(base_text).split("\n")
    head_lines = normalize_newlines(head_text).split("\n")
    added: List[str] = []
    removed: List[str] = []
    for line in difflib.ndiff(base_lines, head_lines):
        if line.startswith("+ "):
            added.append(line[2:])
        elif line.startswith("- "):
            removed.append(line[2:])
    return added, removed


def filter_net_new_entries(added_lines: Iterable[str], removed_lines: Iterable[str]) -> List[Entry]:
    removed_counter: Counter[str] = Counter()
    for line in removed_lines:
        entry = to_entry(line)
        if entry:
            removed_counter[entry.strict_key] += 1

    net_new: List[Entry] = []
    for line in added_lines:
        entry = to_entry(line)
        if not entry:
            continue
        if removed_counter[entry.strict_key] > 0:
            removed_counter[entry.strict_key] -= 1
            continue
        net_new.append(entry)
    return net_new


def is_probably_text(data: bytes) -> bool:
    if b"\x00" in data:
        return False
    return True


def is_payload_file(path: str) -> bool:
    return Path(path).suffix.lower() in PAYLOAD_EXTENSIONS


def build_base_indexes(repo_root: Path) -> Tuple[Dict[str, List[Location]], Dict[str, List[Location]]]:
    strict_index: Dict[str, List[Location]] = defaultdict(list)
    ws_index: Dict[str, List[Location]] = defaultdict(list)

    for file_path in repo_root.rglob("*"):
        if not file_path.is_file():
            continue
        if ".git" in file_path.parts:
            continue
        rel = file_path.relative_to(repo_root).as_posix()
        if not is_payload_file(rel):
            continue

        try:
            data = file_path.read_bytes()
        except OSError:
            continue

        if len(data) > TEXT_FILE_SIZE_LIMIT or not is_probably_text(data):
            continue

        text = data.decode("utf-8", errors="replace")
        for entry, line_no in extract_entries_from_text(text):
            loc = Location(path=rel, line=line_no, text=entry.text)
            strict_index[entry.strict_key].append(loc)
            ws_index[entry.ws_key].append(loc)

    return strict_index, ws_index


def remove_base_occurrences(
    strict_index: Dict[str, List[Location]],
    ws_index: Dict[str, List[Location]],
    path: str,
    removed_entries: Iterable[Entry],
) -> None:
    strict_counts: Counter[str] = Counter(entry.strict_key for entry in removed_entries)
    ws_counts: Counter[str] = Counter(entry.ws_key for entry in removed_entries)

    for key, count in strict_counts.items():
        if key not in strict_index:
            continue
        updated: List[Location] = []
        remaining = count
        for loc in strict_index[key]:
            if remaining > 0 and loc.path == path:
                remaining -= 1
            else:
                updated.append(loc)
        if updated:
            strict_index[key] = updated
        else:
            strict_index.pop(key, None)

    for key, count in ws_counts.items():
        if key not in ws_index:
            continue
        updated = []
        remaining = count
        for loc in ws_index[key]:
            if remaining > 0 and loc.path == path:
                remaining -= 1
            else:
                updated.append(loc)
        if updated:
            ws_index[key] = updated
        else:
            ws_index.pop(key, None)


def api_request(url: str, token: str) -> dict:
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub API request failed ({exc.code}) for {url}: {body}") from exc


def paginated_request(url: str, token: str) -> List[dict]:
    page = 1
    all_items: List[dict] = []
    while True:
        sep = "&" if "?" in url else "?"
        page_url = f"{url}{sep}per_page=100&page={page}"
        chunk = api_request(page_url, token)
        if not isinstance(chunk, list):
            raise RuntimeError(f"Expected paginated list from {page_url}")
        if not chunk:
            break
        all_items.extend(chunk)
        if len(chunk) < 100:
            break
        page += 1
    return all_items


def get_pr_files(api_base: str, owner_repo: str, pr_number: int, token: str) -> List[dict]:
    url = f"{api_base}/repos/{owner_repo}/pulls/{pr_number}/files"
    return paginated_request(url, token)


def get_file_content(api_base: str, owner_repo: str, path: str, ref: str, token: str) -> str:
    encoded_path = urllib.parse.quote(path, safe="/")
    encoded_ref = urllib.parse.quote(ref, safe="")
    url = f"{api_base}/repos/{owner_repo}/contents/{encoded_path}?ref={encoded_ref}"
    data = api_request(url, token)
    if not isinstance(data, dict):
        return ""
    content = data.get("content")
    if not content:
        return ""
    decoded = base64.b64decode(content)
    return decoded.decode("utf-8", errors="replace")


def load_event_payload() -> dict:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        raise RuntimeError("GITHUB_EVENT_PATH is not set")
    with open(event_path, "r", encoding="utf-8") as f:
        return json.load(f)


def make_pr_new_location(path: str, index: int, entry: Entry) -> Location:
    return Location(path=path, line=index + 1, text=entry.text)


def collect_pr_changes(
    api_base: str,
    owner_repo: str,
    pr_number: int,
    head_sha: str,
    base_sha: str,
    token: str,
) -> Tuple[List[Tuple[Entry, Location]], Dict[str, List[Entry]]]:
    files = get_pr_files(api_base, owner_repo, pr_number, token)
    candidates: List[Tuple[Entry, Location]] = []
    removed_by_file: Dict[str, List[Entry]] = defaultdict(list)

    for file_info in files:
        status = file_info.get("status")
        filename = file_info.get("filename")
        if not filename:
            continue
        if not is_payload_file(filename):
            continue
        if status not in {"added", "modified", "renamed", "copied", "changed"}:
            continue

        added_lines: List[str] = []
        removed_lines: List[str] = []

        if status == "added":
            head_text = get_file_content(api_base, owner_repo, filename, head_sha, token)
            added_lines = normalize_newlines(head_text).split("\n")
        else:
            patch = file_info.get("patch")
            if patch:
                added_lines, removed_lines = parse_patch_line_changes(patch)
            else:
                head_text = get_file_content(api_base, owner_repo, filename, head_sha, token)
                base_path = file_info.get("previous_filename", filename)
                base_text = get_file_content(api_base, owner_repo, base_path, base_sha, token)
                added_lines, removed_lines = parse_full_diff_changes(base_text, head_text)

        net_new = filter_net_new_entries(added_lines, removed_lines)
        removed_entries = [entry for line in removed_lines if (entry := to_entry(line))]

        target_removed_path = file_info.get("previous_filename", filename)
        removed_by_file[target_removed_path].extend(removed_entries)

        for idx, entry in enumerate(net_new):
            candidates.append((entry, make_pr_new_location(filename, idx, entry)))

    return candidates, removed_by_file


def find_duplicates(
    candidates: List[Tuple[Entry, Location]],
    strict_index: Dict[str, List[Location]],
    ws_index: Dict[str, List[Location]],
) -> List[Duplicate]:
    duplicates: List[Duplicate] = []
    seen_pr_strict: Dict[str, Location] = {}
    seen_pr_ws: Dict[str, Location] = {}

    for entry, new_loc in candidates:
        existing_strict = strict_index.get(entry.strict_key, [])
        if existing_strict:
            duplicates.append(
                Duplicate(
                    kind="exact duplicate",
                    entry=entry.text,
                    existing=existing_strict[0],
                    new=new_loc,
                )
            )
        else:
            ws_matches = ws_index.get(entry.ws_key, [])
            ws_match = next((loc for loc in ws_matches if loc.text != entry.text), None)
            if ws_match:
                duplicates.append(
                    Duplicate(
                        kind="whitespace/format duplicate",
                        entry=entry.text,
                        existing=ws_match,
                        new=new_loc,
                    )
                )

        if entry.strict_key in seen_pr_strict:
            duplicates.append(
                Duplicate(
                    kind="duplicate within PR (exact)",
                    entry=entry.text,
                    existing=seen_pr_strict[entry.strict_key],
                    new=new_loc,
                )
            )
        else:
            seen_pr_strict[entry.strict_key] = new_loc

        if entry.ws_key in seen_pr_ws and seen_pr_ws[entry.ws_key].text != entry.text:
            duplicates.append(
                Duplicate(
                    kind="duplicate within PR (whitespace/format)",
                    entry=entry.text,
                    existing=seen_pr_ws[entry.ws_key],
                    new=new_loc,
                )
            )
        else:
            seen_pr_ws[entry.ws_key] = new_loc

    return duplicates


def print_duplicates(duplicates: List[Duplicate]) -> None:
    print("::error::Duplicate payload/content entries detected.")
    print("Detected duplicate entries:\n")
    for idx, dup in enumerate(duplicates, start=1):
        print(f"[{idx}] Type: {dup.kind}")
        print(f"    Entry: {dup.entry}")
        print(f"    Existing: {dup.existing.path}:{dup.existing.line}")
        print(f"    New (PR): {dup.new.path}:{dup.new.line}")
        print()


def main() -> int:
    token = os.environ.get("GITHUB_TOKEN")
    repository = os.environ.get("GITHUB_REPOSITORY")
    api_base = os.environ.get("GITHUB_API_URL", "https://api.github.com")

    if not token:
        print("::error::GITHUB_TOKEN is required.")
        return 2
    if not repository:
        print("::error::GITHUB_REPOSITORY is required.")
        return 2

    event = load_event_payload()
    pull_request = event.get("pull_request")
    if not pull_request:
        print("::error::This script must run on pull_request_target events.")
        return 2

    pr_number = pull_request.get("number")
    head_sha = pull_request.get("head", {}).get("sha")
    base_sha = pull_request.get("base", {}).get("sha")
    if not pr_number or not head_sha or not base_sha:
        print("::error::Missing pull request metadata in event payload.")
        return 2

    repo_root = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()
    strict_index, ws_index = build_base_indexes(repo_root)

    candidates, removed_by_file = collect_pr_changes(
        api_base=api_base,
        owner_repo=repository,
        pr_number=int(pr_number),
        head_sha=head_sha,
        base_sha=base_sha,
        token=token,
    )

    for path, removed_entries in removed_by_file.items():
        remove_base_occurrences(strict_index, ws_index, path, removed_entries)

    duplicates = find_duplicates(candidates, strict_index, ws_index)

    if duplicates:
        print_duplicates(duplicates)
        return 1

    print("No duplicate payload/content entries were detected in PR additions/changes.")
    print(f"Checked {len(candidates)} normalized entries from added/modified files.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"::error::{exc}")
        raise SystemExit(2)
