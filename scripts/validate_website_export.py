"""Check that exported HTML resolves local links and assets under GitHub Pages."""

import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


BASE_PATH = "/OWASP-Hunting"
EXPORT = Path("out")


class References(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.urls.append(value)


def check_catalog() -> list[str]:
    """The exported site must carry a consistent payload catalog and one page per category."""
    errors: list[str] = []
    catalog = EXPORT / "payload-catalog"
    index_path = catalog / "index.json"
    if not index_path.is_file():
        return ["Missing out/payload-catalog/index.json"]
    index = json.loads(index_path.read_text(encoding="utf-8"))
    revision = index.get("source", {}).get("revision", "")
    if len(revision) != 40 or any(c not in "0123456789abcdef" for c in revision):
        errors.append("payload-catalog/index.json has no valid source revision")
    categories = index.get("categories", [])
    if not categories:
        errors.append("payload-catalog/index.json lists no categories")
    files = 0
    for category in categories:
        slug = category["slug"]
        chunk = catalog / category["chunk"]
        if not chunk.is_file():
            errors.append(f"Missing catalog chunk: {category['chunk']}")
            continue
        if hashlib.sha256(chunk.read_bytes()).hexdigest() != category["chunkSha256"]:
            errors.append(f"Catalog chunk does not match its recorded hash: {category['chunk']}")
        if not (EXPORT / "payloads" / slug / "index.html").is_file():
            errors.append(f"Missing page for category: /payloads/{slug}/")
        files += len(category["files"])
    if index.get("stats", {}).get("files") != files:
        errors.append("payload-catalog stats.files does not match the category list")
    if not (EXPORT / "payloads" / "index.html").is_file():
        errors.append("Missing /payloads/ page")
    if not errors:
        print(f"Validated payload catalog {revision[:7]}: {len(categories)} categories, {files} files")
    return errors


def main() -> None:
    if not (EXPORT / "index.html").is_file():
        raise SystemExit("Missing out/index.html")
    if not (EXPORT / ".nojekyll").is_file():
        raise SystemExit("Missing out/.nojekyll")
    if (EXPORT / "CNAME").exists():
        raise SystemExit("Unexpected custom domain in export")

    pages = list(EXPORT.rglob("*.html"))
    errors: set[str] = set()
    checked = 0
    for page in pages:
        parser = References()
        parser.feed(page.read_text(encoding="utf-8"))
        for url in parser.urls:
            if not url.startswith("/") or url.startswith("//"):
                continue
            path = unquote(urlsplit(url).path)
            if path != BASE_PATH and not path.startswith(BASE_PATH + "/"):
                errors.add(f"{page}: missing base path: {url}")
                continue
            relative = path.removeprefix(BASE_PATH).lstrip("/")
            target = EXPORT / relative
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                errors.add(f"{page}: missing target: {url}")
            checked += 1

    errors.update(check_catalog())
    if errors:
        raise SystemExit("\n".join(sorted(errors)))
    print(f"Validated {len(pages)} HTML pages and {checked} local references")


if __name__ == "__main__":
    main()
