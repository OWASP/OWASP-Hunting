import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sync_docs_hunting  # noqa: E402


def make_checkout(root: Path) -> None:
    root.mkdir(parents=True)
    subprocess.run(["git", "init", "-q", str(root)], check=True)
    for name in ("package.json", "package-lock.json", "eslint.config.mjs", "postcss.config.mjs", "tsconfig.json"):
        (root / name).write_text("{}\n", encoding="utf-8")
    (root / "src/lib").mkdir(parents=True)
    (root / "src/lib/site-variant.ts").write_text("// variant\n", encoding="utf-8")
    (root / "public/payload-catalog").mkdir(parents=True)


class SyncDocsHunting(unittest.TestCase):
    def test_same_size_change_with_same_mtime_is_copied(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source"
            mirror = Path(tmp) / "mirror"
            make_checkout(source)
            make_checkout(mirror)
            old = mirror / "public/payload-catalog/index.json"
            new = source / "public/payload-catalog/index.json"
            old.write_text('{"version": "1.0.1"}\n', encoding="utf-8")
            new.write_text('{"version": "1.0.2"}\n', encoding="utf-8")
            self.assertEqual(old.stat().st_size, new.stat().st_size)
            stamp = 1_700_000_000
            os.utime(old, (stamp, stamp))
            os.utime(new, (stamp, stamp))

            sync_docs_hunting.sync(source, mirror)

            self.assertEqual(old.read_text(encoding="utf-8"), '{"version": "1.0.2"}\n')


if __name__ == "__main__":
    unittest.main()
