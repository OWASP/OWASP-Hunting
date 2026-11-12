"""Offline regression tests; never execute payloads or call GitHub."""
import base64
import binascii
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import check_duplicates as checker


class DuplicateCheckTests(unittest.TestCase):
    def collect(self, files, contents):
        with patch.object(checker, "api_request", return_value={"merge_base_commit": {"sha": "base"}}), \
             patch.object(checker, "get_pr_files", return_value=files), patch.object(
            checker, "get_file_content",
            side_effect=lambda api, repo, path, ref, token: contents[(path, ref)],
        ):
            return checker.collect_pr_changes("api", "owner/repo", 1, "head", "base", "token")

    def test_modified_file_uses_actual_line_and_complete_content(self):
        base = "\n".join(["# heading"] * 99 + ["existing"])
        head = base + "\n++payload\n--payload\n@@payload"
        candidates, _ = self.collect(
            [{"status": "modified", "filename": "X/test.txt", "patch": "truncated"}],
            {("X/test.txt", "base"): base, ("X/test.txt", "head"): head},
        )
        self.assertEqual([(e.text, loc.line) for e, loc in candidates],
                         [("++payload", 101), ("--payload", 102), ("@@payload", 103)])

    def test_added_file_line_numbers_include_comments_and_blanks(self):
        candidates, _ = self.collect(
            [{"status": "added", "filename": "X/new.txt"}],
            {("X/new.txt", "head"): "# heading\n\npayload"},
        )
        self.assertEqual(candidates[0][1].line, 3)

    def test_move_from_deleted_file_does_not_fail(self):
        candidates, removed = self.collect(
            [{"status": "removed", "filename": "X/old.txt"},
             {"status": "added", "filename": "X/new.txt"}],
            {("X/old.txt", "base"): "payload", ("X/new.txt", "head"): "payload"},
        )
        entry = checker.to_entry("payload")
        loc = checker.Location("X/old.txt", 1, "payload")
        strict, ws = {entry.strict_key: [loc]}, {entry.ws_key: [loc]}
        for path, entries in removed.items():
            checker.remove_base_occurrences(strict, ws, path, entries)
        self.assertEqual(checker.find_duplicates(candidates, strict, ws), [])

    def test_rename_out_of_payload_extension_removes_base(self):
        candidates, removed = self.collect(
            [{"status": "renamed", "previous_filename": "X/old.txt", "filename": "X/new.md"}],
            {("X/old.txt", "base"): "payload"},
        )
        self.assertEqual(candidates, [])
        self.assertEqual(removed["X/old.txt"], [checker.to_entry("payload")])

    def test_rename_into_payload_extension_checks_all_lines(self):
        candidates, _ = self.collect(
            [{"status": "renamed", "previous_filename": "X/old.md", "filename": "X/new.txt"}],
            {("X/new.txt", "head"): "# heading\npayload"},
        )
        self.assertEqual(candidates[0][1].line, 2)

    def test_same_file_reorder_is_not_new(self):
        candidates, removed = self.collect(
            [{"status": "modified", "filename": "X/test.txt"}],
            {("X/test.txt", "base"): "one\ntwo", ("X/test.txt", "head"): "two\none"},
        )
        self.assertEqual(candidates, [])
        self.assertEqual(removed["X/test.txt"], [])

    def test_extra_occurrence_is_detected(self):
        candidates, _ = self.collect(
            [{"status": "modified", "filename": "X/test.txt"}],
            {("X/test.txt", "base"): "payload", ("X/test.txt", "head"): "payload\npayload"},
        )
        loc = checker.Location("X/test.txt", 1, "payload")
        self.assertEqual(len(checker.find_duplicates(candidates, {"payload": [loc]}, {})), 1)

    def test_whitespace_is_preserved_and_matches_are_advisory(self):
        first, second = checker.to_entry(" payload  x "), checker.to_entry("payload x")
        self.assertNotEqual(first.strict_key, second.strict_key)
        matches = checker.find_duplicates(
            [(first, checker.Location("X/new.txt", 3, first.text))], {},
            {second.ws_key: [checker.Location("X/old.txt", 1, second.text)]},
        )
        self.assertEqual(matches[0].kind, "whitespace/format duplicate")

    def test_unreadable_base_fails_instead_of_skipping(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / "payload.txt").write_text("payload")
            with patch.object(Path, "read_bytes", side_effect=OSError("unreadable")):
                with self.assertRaisesRegex(RuntimeError, "Cannot read payload file"):
                    checker.build_base_indexes(Path(folder))

    def test_missing_api_content_fails(self):
        with patch.object(checker, "api_request", return_value={"encoding": "none", "content": ""}):
            with self.assertRaisesRegex(RuntimeError, "Cannot read complete"):
                checker.get_file_content("api", "repo", "X/test.txt", "sha", "token")

    def test_diverged_target_uses_merge_base_for_diff(self):
        with patch.object(checker, "get_pr_files", return_value=[
                {"status": "modified", "filename": "X/test.txt"}]), \
             patch.object(checker, "api_request", return_value={
                 "merge_base_commit": {"sha": "ancestor"}}), \
             patch.object(checker, "get_file_content", side_effect=lambda api, repo, path, ref, token:
                 {"ancestor": "old", "head": "old\nnew"}[ref]) as content:
            candidates, _ = checker.collect_pr_changes("api", "repo", 1, "head", "target", "token")
            self.assertEqual(candidates[0][0].text, "new")
            self.assertEqual(content.call_args_list[0].args[3], "ancestor")

    def test_empty_api_file_is_valid(self):
        with patch.object(checker, "api_request", return_value={"encoding": "base64", "content": ""}):
            self.assertEqual(checker.get_file_content("api", "repo", "X/test.txt", "sha", "token"), "")

    def test_main_advisory_passes_and_exact_duplicate_fails(self):
        for kind, expected in [("whitespace/format duplicate", 0), ("exact duplicate", 1)]:
            with self.subTest(kind=kind), patch.dict(checker.os.environ,
                    {"GITHUB_TOKEN": "test", "GITHUB_REPOSITORY": "owner/repo"}), \
                 patch.object(checker, "load_event_payload", return_value={"pull_request": {
                     "number": 1, "head": {"sha": "head"}, "base": {"sha": "base"}}}), \
                 patch.object(checker, "build_base_indexes", return_value=({}, {})), \
                 patch.object(checker, "collect_pr_changes", return_value=([], {})), \
                 patch.object(checker, "find_duplicates", return_value=[checker.Duplicate(
                     kind, "payload", checker.Location("old", 1, "payload"),
                     checker.Location("new", 2, "payload"))]), \
                 patch.object(checker, "upsert_pr_comment"), \
                 patch.object(checker, "set_duplicate_label") as label, \
                 patch("builtins.print"):
                self.assertEqual(checker.main(), expected)
                self.assertEqual(label.call_args.kwargs["has_duplicates"], bool(expected))

    def test_removal_preserves_other_whitespace_variant(self):
        first = checker.Location("X/test.txt", 1, "payload  x")
        second = checker.Location("X/test.txt", 2, "payload x")
        strict = {first.text: [first], second.text: [second]}
        ws = {"payload x": [first, second]}
        checker.remove_base_occurrences(strict, ws, "X/test.txt", [checker.to_entry(second.text)])
        self.assertEqual(ws["payload x"], [first])
        self.assertNotIn(second.text, strict)

    def test_removal_accepts_single_use_iterables(self):
        loc = checker.Location("X/test.txt", 1, "payload")
        strict, ws = {"payload": [loc]}, {"payload": [loc]}
        checker.remove_base_occurrences(strict, ws, loc.path,
                                        (checker.to_entry(t) for t in ["payload"]))
        self.assertEqual((strict, ws), ({}, {}))

    def test_comment_ignores_forged_markers_and_other_bots(self):
        comments = [
            {"id": 1, "body": checker.COMMENT_MARKER, "user": {"login": "contributor", "type": "User"}},
            {"id": 2, "body": checker.COMMENT_MARKER, "user": {"login": "other[bot]", "type": "Bot"}},
            {"id": 3, "body": None, "user": {"login": "github-actions[bot]", "type": "Bot"}},
            {"id": 4, "body": checker.COMMENT_MARKER, "user": {"login": "github-actions[bot]", "type": "Bot"}},
        ]
        with patch.object(checker, "paginated_request", return_value=comments):
            self.assertEqual(checker.find_bot_comment_id("api", "repo", 1, "token"), 4)

    def test_markdown_handles_html_backticks_pipes_and_newlines(self):
        rendered = checker.format_entry_for_markdown("`<tag>|x\ny")
        self.assertEqual(rendered, "<code>&#96;&lt;tag&gt;&#124;x&#10;y</code>")

    def test_comment_caps_rows_and_escapes_paths(self):
        duplicate = checker.Duplicate("exact duplicate", "payload|`",
            checker.Location("old|path", 1, "payload"), checker.Location("new|path", 2, "payload"))
        comment = checker.build_duplicate_comment_body([duplicate] * 500)
        rows = [line for line in comment.splitlines() if line.startswith("| ")]
        self.assertEqual(len(rows), 51)  # Header plus 50 matches.
        self.assertIn("Showing 50 of 500", comment)
        self.assertIn("new&#124;path:2", comment)
        self.assertLess(len(comment), 65536)

    def test_comment_stays_below_api_limit_after_escaping(self):
        duplicate = checker.Duplicate("exact duplicate", "|"*200,
            checker.Location("|"*200, 1, "payload"), checker.Location("|"*200, 2, "payload"))
        comment = checker.build_duplicate_comment_body([duplicate]*500)
        self.assertLess(len(comment), 65536)
        self.assertIn("of 500 matches", comment)

    def test_invalid_base64_is_not_accepted_as_empty_content(self):
        with patch.object(checker, "api_request", return_value={"encoding": "base64", "content": "!!!!"}):
            with self.assertRaises(binascii.Error):
                checker.get_file_content("api", "repo", "X/test.txt", "sha", "token")

    def test_wrapped_base64_content_is_supported(self):
        encoded = base64.b64encode(b"payload").decode()
        with patch.object(checker, "api_request", return_value={"encoding": "base64", "content": encoded[:4]+"\n"+encoded[4:]}):
            self.assertEqual(checker.get_file_content("api", "repo", "X/test.txt", "sha", "token"), "payload")

    def test_invalid_utf8_and_binary_content_fail(self):
        for raw, error in [(b"\xff", UnicodeDecodeError), (b"\0", RuntimeError)]:
            with self.subTest(raw=raw), patch.object(checker, "api_request", return_value={
                    "encoding": "base64", "content": base64.b64encode(raw).decode()}):
                with self.assertRaises(error):
                    checker.get_file_content("api", "repo", "X/test.txt", "sha", "token")

    def test_truncated_file_list_fails(self):
        with patch.object(checker, "get_pr_files", return_value=[{}]*3000):
            with self.assertRaisesRegex(RuntimeError, "truncated"):
                checker.collect_pr_changes("api", "repo", 1, "head", "base", "token")

    def test_comment_failure_does_not_change_duplicate_verdict(self):
        with patch.object(checker, "find_bot_comment_id", return_value=None), \
             patch.object(checker, "api_mutate_request", side_effect=checker.GithubApiError(403, "denied")), \
             patch("builtins.print") as output:
            checker.upsert_pr_comment("api", "repo", 1, "token", "result")
            self.assertIn("Could not post PR comment", output.call_args.args[0])


if __name__ == "__main__":
    unittest.main()
