#!/usr/bin/env python3
"""Check pull request additions for duplicate payload/content entries."""

from __future__ import annotations

import base64
import difflib
import html
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
PAYLOAD_FILE_SUFFIX = ".txt"


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
    return Entry(text=line, strict_key=line, ws_key=ws_key_for(line))


def extract_entries_from_text(text: str) -> List[Tuple[Entry, int]]:
    out: List[Tuple[Entry, int]] = []
    for idx, line in enumerate(normalize_newlines(text).split("\n"), start=1):
        entry = to_entry(line)
        if entry:
            out.append((entry, idx))
    return out


def changed_lines(base_text: str, head_text: str) -> Tuple[List[Tuple[str, int]], List[str]]:
    """Return additions with real head line numbers, and removed base lines.

    Compare complete files so truncated API patches and diff-like payload text
    cannot hide additions. Disable autojunk for repetitive protocol fixtures.
    """
    base = normalize_newlines(base_text).split("\n")
    head = normalize_newlines(head_text).split("\n")
    added: List[Tuple[str, int]] = []
    removed: List[str] = []
    matcher = difflib.SequenceMatcher(None, base, head, autojunk=False)
    for tag, i, j, start, end in matcher.get_opcodes():
        if tag in {"replace", "delete"}:
            removed.extend(base[i:j])
        if tag in {"replace", "insert"}:
            added.extend((head[k], k + 1) for k in range(start, end))
    return added, removed


def is_probably_text(data: bytes) -> bool:
    if b"\x00" in data:
        return False
    return True


def build_base_indexes(repo_root: Path) -> Tuple[Dict[str, List[Location]], Dict[str, List[Location]]]:
    strict_index: Dict[str, List[Location]] = defaultdict(list)
    ws_index: Dict[str, List[Location]] = defaultdict(list)

    for file_path in repo_root.rglob(f"*{PAYLOAD_FILE_SUFFIX}"):
        if not file_path.is_file():
            continue
        if ".git" in file_path.parts:
            continue
        rel = file_path.relative_to(repo_root).as_posix()

        try:
            data = file_path.read_bytes()
        except OSError as exc:
            raise RuntimeError(f"Cannot read payload file {rel}: {exc}") from exc

        if len(data) > TEXT_FILE_SIZE_LIMIT or not is_probably_text(data):
            raise RuntimeError(f"Cannot index payload file {rel}: oversized or binary content")

        text = data.decode("utf-8")
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
    removed_entries = list(removed_entries)
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
        exact_counts = Counter(entry.strict_key for entry in removed_entries if entry.ws_key == key)
        if key not in ws_index:
            continue
        updated = []
        remaining = count
        for loc in ws_index[key]:
            if remaining > 0 and loc.path == path and exact_counts[loc.text] > 0:
                remaining -= 1
                exact_counts[loc.text] -= 1
            else:
                updated.append(loc)
        if updated:
            ws_index[key] = updated
        else:
            ws_index.pop(key, None)


class GithubApiError(RuntimeError):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code


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
        raise GithubApiError(exc.code, f"GitHub API request failed ({exc.code}) for {url}: {body}") from exc


def api_mutate_request(url: str, token: str, method: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise GithubApiError(exc.code, f"GitHub API request failed ({exc.code}) for {url}: {body}") from exc


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
    if not isinstance(data, dict) or data.get("encoding") != "base64":
        raise RuntimeError(f"Cannot read complete payload file {path} at {ref}")
    content = data.get("content")
    if not isinstance(content, str):
        raise RuntimeError(f"Missing payload content for {path} at {ref}")
    decoded = base64.b64decode("".join(content.split()), validate=True)
    if len(decoded) > TEXT_FILE_SIZE_LIMIT or not is_probably_text(decoded):
        raise RuntimeError(f"Cannot inspect payload file {path}: oversized or binary content")
    return decoded.decode("utf-8")


def load_event_payload() -> dict:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        raise RuntimeError("GITHUB_EVENT_PATH is not set")
    with open(event_path, "r", encoding="utf-8") as f:
        return json.load(f)


def collect_pr_changes(
    api_base: str,
    owner_repo: str,
    pr_number: int,
    head_sha: str,
    base_sha: str,
    token: str,
) -> Tuple[List[Tuple[Entry, Location]], Dict[str, List[Entry]]]:
    files = get_pr_files(api_base, owner_repo, pr_number, token)
    if len(files) >= 3000:
        raise RuntimeError("PR file list may be truncated; cannot check all payloads")
    # PR file lists describe the merge-base-to-head changes, not changes made
    # only on the target branch after this PR diverged.
    comparison = api_request(
        f"{api_base}/repos/{owner_repo}/compare/{base_sha}...{head_sha}", token
    )
    merge_base_sha = comparison.get("merge_base_commit", {}).get("sha")
    if not merge_base_sha:
        raise RuntimeError("Cannot determine PR merge base")
    candidates: List[Tuple[Entry, Location]] = []
    removed_by_file: Dict[str, List[Entry]] = defaultdict(list)
    for info in files:
        status = info.get("status")
        filename = info.get("filename", "")
        base_path = info.get("previous_filename", filename)
        base_is_payload = base_path.endswith(PAYLOAD_FILE_SUFFIX)
        head_is_payload = filename.endswith(PAYLOAD_FILE_SUFFIX)
        if not (base_is_payload or head_is_payload):
            continue
        if status not in {"added", "modified", "removed", "renamed", "copied", "changed"}:
            raise RuntimeError(f"Unsupported payload file status: {status}")
        base_text = ""
        if base_is_payload and status not in {"added", "copied"}:
            base_text = get_file_content(api_base, owner_repo, base_path, merge_base_sha, token)
        head_text = ""
        if head_is_payload and status != "removed":
            head_text = get_file_content(api_base, owner_repo, filename, head_sha, token)
        added, removed = changed_lines(base_text, head_text)
        removed_by_file[base_path].extend(
            entry for line in removed if (entry := to_entry(line))
        )
        # Cancel moves within a file while retaining line numbers for additions.
        removed_counts = Counter(entry.strict_key for entry in removed_by_file[base_path])
        for line, line_no in added:
            entry = to_entry(line)
            if entry is None:
                continue
            if removed_counts[entry.strict_key]:
                removed_counts[entry.strict_key] -= 1
                # A moved entry still exists in the final tree's base index.
                removed_by_file[base_path].remove(entry)
                continue
            candidates.append((entry, Location(filename, line_no, entry.text)))
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
    print("Duplicate payload/content entries detected (whitespace-only matches are advisory).")
    print("Detected duplicate entries:\n")
    for idx, dup in enumerate(duplicates, start=1):
        print(f"[{idx}] Type: {dup.kind}")
        print(f"    Entry: {dup.entry}")
        print(f"    Existing: {dup.existing.path}:{dup.existing.line}")
        print(f"    New (PR): {dup.new.path}:{dup.new.line}")
        print()


COMMENT_MARKER = "<!-- duplicate-payload-check-bot -->"


def format_entry_for_markdown(text: str) -> str:
    # HTML code tags avoid backtick delimiter collisions. Encode pipes as well
    # so payloads and contributor-controlled paths cannot split table cells.
    if len(text) > 200:
        text = text[:200] + "..."
    escaped = html.escape(text).replace("|", "&#124;").replace("`", "&#96;").replace("\\", "&#92;")
    escaped = escaped.replace("\r", "&#13;").replace("\n", "&#10;")
    return f"<code>{escaped}</code>"


def build_duplicate_comment_body(duplicates: List[Duplicate]) -> str:
    lines = [
        COMMENT_MARKER,
        "### Duplicate payload matches",
        "",
        "Exact duplicates fail this check. Whitespace/format matches are advisory "
        "because spacing can change payload behavior. Review matches in their section context.",
        "",
        "| # | Entry | New location | Already exists at | Type |",
        "|---|---|---|---|---|",
    ]
    shown = 0
    for idx, dup in enumerate(duplicates[:50], start=1):
        entry = format_entry_for_markdown(dup.entry)
        row = (
            f"| {idx} | {entry} | {format_entry_for_markdown(f'{dup.new.path}:{dup.new.line}')} "
            f"| {format_entry_for_markdown(f'{dup.existing.path}:{dup.existing.line}')} | {dup.kind} |"
        )
        if sum(len(line) + 1 for line in lines) + len(row) > 58000:
            break
        lines.append(row)
        shown += 1
    if len(duplicates) > shown:
        lines.append(f"\nShowing {shown} of {len(duplicates)} matches; see the workflow log for all matches.")
    lines.append("")
    lines.append("_Posted automatically by the Duplicate Payload Check workflow._")
    return "\n".join(lines)


def build_success_comment_body(checked_count: int) -> str:
    return (
        f"{COMMENT_MARKER}\n"
        "### :white_check_mark: No duplicate payload entries detected\n\n"
        f"Checked {checked_count} normalized entries from added/modified payload files on the latest push.\n\n"
        "_Posted automatically by the Duplicate Payload Check workflow._"
    )


def find_bot_comment_id(api_base: str, owner_repo: str, pr_number: int, token: str) -> Optional[int]:
    url = f"{api_base}/repos/{owner_repo}/issues/{pr_number}/comments"
    for comment in paginated_request(url, token):
        if (comment.get("user", {}).get("login") == "github-actions[bot]"
                and comment.get("user", {}).get("type") == "Bot"
                and COMMENT_MARKER in (comment.get("body") or "")):
            return comment.get("id")
    return None


def upsert_pr_comment(api_base: str, owner_repo: str, pr_number: int, token: str, body: str) -> None:
    try:
        existing_id = find_bot_comment_id(api_base, owner_repo, pr_number, token)
        if existing_id:
            url = f"{api_base}/repos/{owner_repo}/issues/comments/{existing_id}"
            api_mutate_request(url, token, "PATCH", {"body": body})
        else:
            url = f"{api_base}/repos/{owner_repo}/issues/{pr_number}/comments"
            api_mutate_request(url, token, "POST", {"body": body})
    except GithubApiError as exc:
        # Never fail the whole check just because commenting failed (e.g. missing
        # permissions on a fork-originated event) — the job's pass/fail status
        # from stdout/exit code is still authoritative.
        print(f"::warning::Could not post PR comment: {exc}")


DUPLICATE_LABEL = "duplicate"


def set_duplicate_label(api_base: str, owner_repo: str, pr_number: int, token: str, has_duplicates: bool) -> None:
    """Apply or remove the 'duplicate' label based on actual detection results.

    This is the only place that touches the 'duplicate' label — it is never
    inferred from changed file paths (see .github/labeler.yml).
    """
    try:
        if has_duplicates:
            url = f"{api_base}/repos/{owner_repo}/issues/{pr_number}/labels"
            api_mutate_request(url, token, "POST", {"labels": [DUPLICATE_LABEL]})
        else:
            url = f"{api_base}/repos/{owner_repo}/issues/{pr_number}/labels/{DUPLICATE_LABEL}"
            try:
                api_mutate_request(url, token, "DELETE", {})
            except GithubApiError as exc:
                if exc.status_code != 404:  # 404 just means it wasn't set — fine
                    raise
    except GithubApiError as exc:
        print(f"::warning::Could not update '{DUPLICATE_LABEL}' label: {exc}")


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

    blocking = [dup for dup in duplicates if "whitespace/format" not in dup.kind]
    if duplicates:
        print_duplicates(duplicates)
        upsert_pr_comment(
            api_base, repository, int(pr_number), token, build_duplicate_comment_body(duplicates)
        )
        set_duplicate_label(api_base, repository, int(pr_number), token, has_duplicates=bool(blocking))
        return 1 if blocking else 0

    print("No duplicate payload/content entries were detected in PR additions/changes.")
    print(f"Checked {len(candidates)} normalized entries from added/modified files.")
    upsert_pr_comment(
        api_base,
        repository,
        int(pr_number),
        token,
        build_success_comment_body(len(candidates)),
    )
    set_duplicate_label(api_base, repository, int(pr_number), token, has_duplicates=False)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"::error::{exc}")
        raise SystemExit(2)
