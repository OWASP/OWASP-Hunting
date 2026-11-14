const assert = require('node:assert/strict');
const { test } = require('node:test');
const { prepare, report } = require('./manual_pr_build.cjs');

const SHA = 'a769452286130f72cd3cdf7f27c994c1bec62952';
function fixture() {
  const calls = { pulls: [], statuses: [], outputs: {}, summary: [] };
  const pr = { state: 'open', base: { ref: 'website', repo: { full_name: 'OWASP/OWASP-Hunting' } }, head: { sha: SHA } };
  const context = { eventName: 'workflow_dispatch', actor: '0x5t4l1n', repo: { owner: 'OWASP', repo: 'OWASP-Hunting' }, ref: 'refs/heads/main', runId: 123 };
  const env = { GITHUB_TRIGGERING_ACTOR: '0x5t4l1n', PR_NUMBER: '112', PR_HEAD_SHA: SHA, BUILD_RESULT: 'success' };
  const github = { rest: {
    pulls: { get: async (input) => { calls.pulls.push(input); return { data: pr }; } },
    repos: { createCommitStatus: async (input) => calls.statuses.push(input) },
  } };
  const core = { setOutput: (name, value) => { calls.outputs[name] = value; }, summary: {
    addRaw(text) { calls.summary.push(text); return this; }, async write() {},
  } };
  return { github, context, core, env, calls, pr };
}

test('resolves and pins the PR head, with a pending status on that exact SHA', async () => {
  const f = fixture();
  await prepare(f);
  assert.deepEqual(f.calls.outputs, { head_sha: SHA, pr_number: '112' });
  assert.equal(f.calls.statuses[0].sha, SHA);
  assert.equal(f.calls.statuses[0].state, 'pending');
  assert.equal(f.calls.statuses[0].context, 'Manual PR build');
});

for (const [name, mutate] of [
  ['another original actor', f => { f.context.actor = 'contributor'; }],
  ['another rerun actor', f => { f.env.GITHUB_TRIGGERING_ACTOR = 'contributor'; }],
  ['a missing rerun identity', f => { delete f.env.GITHUB_TRIGGERING_ACTOR; }],
  ['a fork', f => { f.context.repo.owner = 'fork'; }],
  ['a non-default branch', f => { f.context.ref = 'refs/heads/feature'; }],
  ['an automatic event', f => { f.context.eventName = 'pull_request'; }],
]) {
  test(`rejects ${name} before any PR API or status write`, async () => {
    for (const action of [prepare, report]) {
      const f = fixture(); mutate(f);
      await assert.rejects(action(f), /Only 0x5t4l1n/);
      assert.equal(f.calls.pulls.length, 0);
      assert.equal(f.calls.statuses.length, 0);
    }
  });
}

for (const input of ['0', '-1', '1.5', '112; echo injected', '${{ secrets.TOKEN }}', '9007199254740992', '']) {
  test(`rejects invalid PR input ${JSON.stringify(input)}`, async () => {
    const f = fixture(); f.env.PR_NUMBER = input;
    await assert.rejects(prepare(f), /positive integer/);
    assert.equal(f.calls.pulls.length, 0);
  });
}

for (const [name, mutate] of [
  ['closed PR', f => { f.pr.state = 'closed'; }],
  ['wrong target branch', f => { f.pr.base.ref = 'main'; }],
  ['wrong base repository', f => { f.pr.base.repo.full_name = 'fork/repo'; }],
  ['invalid head SHA', f => { f.pr.head.sha = 'branch-name'; }],
]) {
  test(`does not schedule a build for ${name}`, async () => {
    const f = fixture(); mutate(f);
    await assert.rejects(prepare(f));
    assert.equal(f.calls.statuses.length, 0);
    assert.deepEqual(f.calls.outputs, {});
  });
}

for (const [result, state] of Object.entries({ success: 'success', failure: 'failure', cancelled: 'error', skipped: 'error' })) {
  test(`publishes ${result} as ${state} on the tested SHA`, async () => {
    const f = fixture(); f.env.BUILD_RESULT = result;
    await report(f);
    assert.equal(f.calls.statuses[0].sha, SHA);
    assert.equal(f.calls.statuses[0].state, state);
    assert.equal(f.calls.pulls.length, 0);
    assert.match(f.calls.summary[0], new RegExp(SHA));
  });
}

test('an unknown outcome cannot be reported as a successful build', async () => {
  const f = fixture(); f.env.BUILD_RESULT = 'pending';
  await assert.rejects(report(f), /Unknown build result/);
  assert.equal(f.calls.statuses.length, 0);
});
