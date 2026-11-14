"""Copy OWASP website files into a checkout of the deployment mirror.

Run against a separate, clean docs-hunting checkout. This script never pushes.
"""

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT_FILES = (
    "package.json",
    "package-lock.json",
    "eslint.config.mjs",
    "postcss.config.mjs",
    "tsconfig.json",
)
PROTECTED = {
    "src/lib/site-variant.ts",
    "public/CNAME",
    "public/robots.txt",
}
MANIFEST = ".owasp-website-sync.json"


def allowed(path: str) -> bool:
    parts = Path(path).parts
    return (
        path not in PROTECTED
        and ".." not in parts
        and not Path(path).is_absolute()
        and (path in ROOT_FILES or (parts and parts[0] in {"src", "public"}))
    )


def check_tree(root: Path) -> None:
    for directory in (root / "src", root / "public"):
        if not directory.is_dir():
            raise ValueError(f"Missing website directory: {directory}")
        if directory.is_symlink() or any(path.is_symlink() for path in directory.rglob("*")):
            raise ValueError(f"Symlinks are not supported in managed website files: {directory}")


def current_files(source: Path) -> set[str]:
    files = {
        path.relative_to(source).as_posix()
        for folder in ("src", "public")
        for path in (source / folder).rglob("*")
        if path.is_file()
    }
    files.update(ROOT_FILES)
    if not all((source / name).is_file() for name in ROOT_FILES):
        raise ValueError("A required website build file is missing")
    return {name for name in files if allowed(name)}


def read_manifest(destination: Path) -> set[str]:
    path = destination / MANIFEST
    if not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("version") != 1 or not isinstance(data.get("files"), list):
        raise ValueError("Invalid mirror manifest")
    files = data["files"]
    if not all(isinstance(name, str) and allowed(name) for name in files):
        raise ValueError("Mirror manifest contains an unsafe path")
    return set(files)


def ensure_site_variant(destination: Path) -> None:
    variant = destination / "src/lib/site-variant.ts"
    if variant.exists():
        return
    cname_file = destination / "public/CNAME"
    if not cname_file.is_file():
        cname_file = destination / "CNAME"
    if not cname_file.is_file():
        raise ValueError("Mirror needs a CNAME or an existing src/lib/site-variant.ts")
    domain = cname_file.read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]", domain):
        raise ValueError("Invalid destination CNAME")
    variant.parent.mkdir(parents=True, exist_ok=True)
    variant.write_text(
        "// Deployment-specific values; the OWASP sync preserves this file.\n"
        "export const SITE_VARIANT = {\n"
        f'  url: "https://{domain}/",\n'
        '  basePath: "",\n'
        "} as const;\n",
        encoding="utf-8",
    )


def sync(source: Path, destination: Path) -> None:
    source = source.resolve()
    destination = destination.resolve()
    if source == destination or not (destination / ".git").exists():
        raise ValueError("Destination must be a separate Git checkout")
    check_tree(source)
    check_tree(destination)
    new_files = current_files(source)
    old_files = read_manifest(destination)
    ensure_site_variant(destination)

    subprocess.run(
        ["rsync", "-a", "--exclude=/lib/site-variant.ts", f"{source}/src/", f"{destination}/src/"],
        check=True,
    )
    subprocess.run(
        ["rsync", "-a", "--exclude=/CNAME", "--exclude=/robots.txt", f"{source}/public/", f"{destination}/public/"],
        check=True,
    )
    for name in ROOT_FILES:
        subprocess.run(["rsync", "-a", str(source / name), str(destination / name)], check=True)

    removed = 0
    for name in sorted(old_files - new_files):
        path = destination / name
        if path.is_file():
            path.unlink()
            removed += 1

    (destination / MANIFEST).write_text(
        json.dumps({"version": 1, "files": sorted(new_files)}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Mirrored {len(new_files)} website files; removed {removed} previously mirrored files")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: sync_docs_hunting.py SOURCE_CHECKOUT MIRROR_CHECKOUT")
    try:
        sync(Path(sys.argv[1]), Path(sys.argv[2]))
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"Website sync failed: {error}") from error
