const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { validate, run } = require('./pr_template.cjs');

const template = fs.readFileSync(path.join(__dirname, '../.github/PULL_REQUEST_TEMPLATE.md'), 'utf8');
function complete(ai = false) {
  return template.replace(/<!--[\s\S]*?-->/g, '').replaceAll('- [ ]', '- [x]')
    .replace(ai ? '- [x] No AI assistance used.' : '- [x] AI tools assisted with this contribution.',
      ai ? '- [ ] No AI assistance used.' : '- [ ] AI tools assisted with this contribution.')
    .replace('## Summary', '## Summary\n\nReplace a dead reference link.')
    .replace('## Motivation / Security-Research Context', '## Motivation / Security-Research Context\n\nFix broken documentation.')
    .replace('## Affected Category', '## Affected Category\n\nTiming-Attacks, docs-only.')
    .replace('## Validation Performed', '## Validation Performed\n\nOpened both links and reviewed the cited content.')
    .replace('## Source Attribution and References', '## Source Attribution and References\n\nN/A')
    .replace('**Tool/model:**', '**Tool/model:** unknown')
    .replace('**Provider:**', '**Provider:** unknown')
    .replace('**What it helped with:**', '**What it helped with:** Wrote the description.')
    .replace('**Human validation performed:**', '**Human validation performed:** Read the diff and checked the links.');
}

test('completed descriptions accept either AI disclosure option', () => {
  assert.deepEqual(validate(complete(), template), []);
  assert.deepEqual(validate(complete(true), template), []);
});

test('blank, template-only, and the short PR #97 format fail', () => {
  for (const body of [null, '', template, 'The external link was returning HTTP 404.\n\nFixes #77']) {
    assert.ok(validate(body, template).length > 0);
  }
});

test('every template section is required', () => {
  for (const match of template.matchAll(/^## (.+)$/gm)) {
    assert.ok(validate(complete().replace(`## ${match[1]}`, '## Other section'), template)
      .some(error => error.includes(`Add the "${match[1]}" section`)));
  }
});

test('empty prose and placeholders fail but sources may be N/A', () => {
  for (const text of ['', '<!-- Checked everything -->', 'N/A', 'TBD', '...', '<summary>']) {
    assert.ok(validate(complete().replace('Replace a dead reference link.', text), template)
      .some(error => error.includes('Fill in "Summary"')));
  }
});

test('duplicate sections fail instead of hiding an incomplete section', () => {
  assert.match(validate(`${complete()}\n## Summary\nDifferent summary`, template)[0], /only one/);
});

test('HTML comments, fenced code, and quotes cannot supply the template', () => {
  for (const body of [`<!--\n${complete()}\n-->`, `\x60\x60\x60markdown\n${complete()}\n\x60\x60\x60`,
    `~~~markdown\n${complete()}\n~~~`, complete().split('\n').map(line => `> ${line}`).join('\n')]) {
    assert.ok(validate(body, template).some(error => error.includes('Add the "Summary"')));
  }
});

test('both or neither AI checkboxes are rejected', () => {
  assert.ok(validate(complete().replace('- [ ] AI tools', '- [x] AI tools'), template)
    .includes('Select exactly one AI-assistance checkbox.'));
  assert.ok(validate(complete().replace('- [x] No AI', '- [ ] No AI'), template)
    .includes('Select exactly one AI-assistance checkbox.'));
});

test('AI assistance requires contribution and personal validation, unknown model is allowed', () => {
  for (const text of ['Wrote the description.', 'Read the diff and checked the links.']) {
    assert.ok(validate(complete(true).replace(text, ''), template).some(error => error.includes('AI disclosure')));
  }
  for (const field of ['Tool/model', 'Provider']) {
    assert.ok(validate(complete(true).replace(`**${field}:** unknown`, `**${field}:**`), template)
      .some(error => error.includes('AI disclosure')));
  }
  assert.ok(validate(complete(true).replace('Wrote the description.', 'unknown'), template).length);
});

test('no-AI disclosures do not require tool details', () => {
  assert.deepEqual(validate(complete().replace(/^- \*\*(?:Tool\/model|Provider|What it helped with|Human validation performed):\*\*.*$/gm, ''), template), []);
});

test('all licensing, duplicate, and responsible-use confirmations must be checked', () => {
  for (const line of complete().split('\n').filter(line => line.startsWith('- [x]') && !line.includes('No AI'))) {
    assert.ok(validate(complete().replace(line, line.replace('[x]', '[ ]')), template).some(error => error.startsWith('Confirm')));
  }
});

test('fake checkboxes in code or comments do not satisfy confirmations', () => {
  const line = '- [x] This contribution is my own work, or is properly attributed to its original source.';
  for (const replacement of [`<!-- ${line} -->`, `\x60\x60\x60\n${line}\n\x60\x60\x60`, `> ${line}`]) {
    assert.ok(validate(complete().replace(line, replacement), template).some(error => error.startsWith('Confirm')));
  }
});

test('CRLF, uppercase checks, reordered sections, and Markdown license links are accepted', () => {
  const reordered = complete().split(/(?=^## )/m).reverse().join('\n');
  assert.deepEqual(validate(reordered.replaceAll('[x]', '[X]').replaceAll('\n', '\r\n'), template), []);
});

function harness(body, overrides = {}) {
  const calls = [];
  const pr = { body, state: 'open', head: { sha: 'head' }, base: { ref: 'main' }, draft: false,
    user: { login: 'contributor' }, requested_reviewers: [], ...overrides };
  const endpoint = name => async args => { calls.push([name, args]); return { data: pr }; };
  const github = {
    rest: {
      pulls: { get: endpoint('get'), listReviews: 'reviews', requestReviewers: endpoint('request'), removeRequestedReviewers: endpoint('remove') },
      issues: { listComments: 'comments', updateComment: endpoint('update'), createComment: endpoint('create') },
    },
    paginate: async endpoint => endpoint === 'comments' ? (overrides.comments || []) : (overrides.reviews || []),
  };
  const context = { repo: { owner: 'OWASP', repo: 'OWASP-Hunting' }, payload: { pull_request: { number: 97, head: { sha: 'head' }, base: { ref: 'main' } } } };
  const core = { info: message => calls.push(['info', message]), setFailed: message => calls.push(['failed', message]) };
  return { github, context, core, calls };
}

test('invalid descriptions create actionable comments and never request review', async () => {
  const h = harness('Fixes #77');
  await run(h);
  assert.ok(h.calls.some(([name]) => name === 'failed'));
  assert.ok(!h.calls.some(([name]) => name === 'request'));
  assert.match(h.calls.find(([name]) => name === 'create')[1].body, /Please correct the PR description/);
});

test('uses one authenticated bot comment, ignoring forged markers', async () => {
  const h = harness('', { comments: [
    { id: 1, body: '<!-- pr-template-check -->', user: { login: 'contributor', type: 'User' } },
    { id: 2, body: '<!-- pr-template-check -->', user: { login: 'github-actions[bot]', type: 'Bot' } },
  ] });
  await run(h);
  assert.equal(h.calls.find(([name]) => name === 'update')[1].comment_id, 2);
  assert.ok(!h.calls.some(([name]) => name === 'create'));
});

test('a corrected description updates the comment and requests the configured reviewer', async () => {
  const h = harness(complete(), { comments: [
    { id: 2, body: '<!-- pr-template-check --> old failure', user: { login: 'github-actions[bot]', type: 'Bot' } },
  ] });
  await run(h);
  assert.match(h.calls.find(([name]) => name === 'update')[1].body, /check passed/);
  assert.deepEqual(h.calls.find(([name]) => name === 'request')[1].reviewers, ['0x5t4l1n']);
});

test('read-only test preflight validates without comments or reviewer writes', async () => {
  for (const body of ['', complete()]) {
    const h = harness(body);
    await run({ ...h, report: false });
    assert.ok(h.calls.every(([name]) => ['get', 'info', 'failed'].includes(name)));
  }
});

test('invalid or draft PRs clear only configured pending reviewers', async () => {
  for (const [body, draft] of [['', false], [complete(), true]]) {
    const h = harness(body, { draft, requested_reviewers: [{ login: '0x5t4l1n' }, { login: 'someone-else' }] });
    await run(h);
    assert.deepEqual(h.calls.find(([name]) => name === 'remove')[1].reviewers, ['0x5t4l1n']);
    assert.ok(!h.calls.some(([name]) => name === 'request'));
  }
});

test('does not request a self-review, duplicate review, or repeat a completed review', async () => {
  for (const overrides of [
    { user: { login: '0x5t4l1n' } }, { requested_reviewers: [{ login: '0x5t4l1n' }] },
    { reviews: [{ state: 'APPROVED', user: { login: '0x5t4l1n' } }] }, { draft: true },
  ]) {
    const h = harness(complete(), overrides);
    await run(h);
    assert.ok(!h.calls.some(([name]) => name === 'request'));
  }
});

test('obsolete runs do not write or allow downstream checks', async () => {
  for (const overrides of [{ state: 'closed' }, { head: { sha: 'new-head' } }, { base: { ref: 'website' } }]) {
    const h = harness(complete(), overrides);
    await run(h);
    assert.deepEqual(h.calls.map(([name]) => name), ['get', 'failed']);
  }
});

test('GitHub API errors fail closed', async () => {
  const h = harness('');
  h.github.rest.issues.createComment = async () => { throw new Error('403'); };
  await assert.rejects(run(h), /403/);
  assert.ok(!h.calls.some(([name]) => name === 'request'));
});
