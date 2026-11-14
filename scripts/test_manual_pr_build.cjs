const assert = require('node:assert/strict');
const { test } = require('node:test');
const { prepare, report, authorize } = require('./manual_pr_build.cjs');

const SHA = 'a769452286130f72cd3cdf7f27c994c1bec62952';
const BASE = 'b'.repeat(40);
function fixture() {
  const calls = { pulls: [], owners: [], permissions: [], comments: [], statuses: [], posted: [], updated: [], listed: [], outputs: {}, summary: [] };
  const pr = { state: 'open', base: { sha: BASE, ref: 'website', repo: { full_name: 'OWASP/OWASP-Hunting' } }, head: { sha: SHA } };
  const context = { eventName: 'workflow_dispatch', actor: '0x5t4l1n', repo: { owner: 'OWASP', repo: 'OWASP-Hunting' }, ref: 'refs/heads/main', runId: 123, payload: {} };
  const env = { GITHUB_TRIGGERING_ACTOR: '0x5t4l1n', PR_NUMBER: '112', PR_HEAD_SHA: SHA, BUILD_RESULT: 'success' };
  const policy = { text: '* @0x5t4l1n\n', encoding: 'base64', permission: 'write' };
  const comment = { body: '/check-build', user: { login: '0x5t4l1n', type: 'User' }, issue_url: 'https://api.github.com/repos/OWASP/OWASP-Hunting/issues/112' };
  const resultComments = [];
  const github = { rest: {
    pulls: { get: async input => { calls.pulls.push(input); return { data: pr }; } },
    repos: {
      createCommitStatus: async input => calls.statuses.push(input),
      getCollaboratorPermissionLevel: async input => { calls.permissions.push(input); return { data: { permission: policy.permission } }; },
      getContent: async input => {
        calls.owners.push(input);
        return { data: { encoding: policy.encoding, content: Buffer.from(policy.text).toString('base64') } };
      },
    },
    issues: {
      getComment: async input => { calls.comments.push(input); return { data: comment }; },
      listComments: async () => ({ data: resultComments }),
      createComment: async input => {
        calls.posted.push(input);
        const created = { id: resultComments.length + 1, body: input.body, user: { type: 'Bot', login: 'github-actions[bot]' } };
        resultComments.push(created);
        return { data: created };
      },
      updateComment: async input => {
        calls.updated.push(input);
        resultComments.find(c => c.id === input.comment_id).body = input.body;
      },
    },
  } };
  github.paginate = async (method, input) => {
    assert.equal(method, github.rest.issues.listComments);
    calls.listed.push(input);
    return resultComments;
  };
  const core = { setOutput: (name, value) => { calls.outputs[name] = value; }, summary: {
    addRaw(text) { calls.summary.push(text); return this; }, async write() {},
  } };
  return { github, context, core, env, calls, pr, policy, comment, resultComments };
}
function fromComment(f, body = '/check-build') {
  f.context.eventName = 'issue_comment';
  f.context.payload = {
    action: 'created', issue: { number: 112, pull_request: { url: 'fixture' } },
    comment: { id: 10, body, user: { login: f.context.actor, type: 'User' } },
  };
  f.comment.body = body;
}

for (const viaComment of [false, true]) {
  test(`pins the PR head with a pending status (${viaComment ? 'comment' : 'dispatch'})`, async () => {
    const f = fixture(); if (viaComment) fromComment(f);
    await prepare(f);
    assert.deepEqual(f.calls.outputs, { authorized: 'true', head_sha: SHA, pr_number: '112' });
    assert.equal(f.calls.statuses[0].sha, SHA);
    assert.equal(f.calls.statuses[0].state, 'pending');
    assert.equal(f.calls.statuses[0].context, 'Manual PR build');
    assert.deepEqual(f.calls.owners[0], { owner: 'OWASP', repo: 'OWASP-Hunting', path: '.github/CODEOWNERS', ref: BASE });
  });
}

test('a newly listed direct CODEOWNER can request a build without a hardcoded operator', async () => {
  const f = fixture(); f.context.actor = 'maintainer'; f.env.GITHUB_TRIGGERING_ACTOR = 'maintainer';
  f.policy.text = '* @maintainer\n'; fromComment(f);
  f.comment.user.login = 'maintainer';
  await prepare(f);
  assert.equal(f.calls.outputs.authorized, 'true');
});

for (const [name, mutate] of [
  ['an unlisted original requester', f => { f.context.actor = 'contributor'; }],
  ['an unlisted rerun requester', f => { f.env.GITHUB_TRIGGERING_ACTOR = 'contributor'; }],
  ['missing rerun identity', f => { delete f.env.GITHUB_TRIGGERING_ACTOR; }],
  ['empty CODEOWNERS', f => { f.policy.text = '# @0x5t4l1n is only a comment\n'; }],
  ['email ownership only', f => { f.policy.text = '* owner@example.com\n'; }],
  ['team ownership only', f => { f.policy.text = '* @OWASP/maintainers\n'; }],
  ['an owner mentioned only in a comment', f => { f.policy.text = '* @other # @0x5t4l1n\n'; }],
  ['listed user without write access', f => { f.policy.permission = 'read'; }],
  ['unsupported CODEOWNERS encoding', f => { f.policy.encoding = 'none'; }],
  ['an invalid base SHA', f => { f.pr.base.sha = 'pr-branch'; }],
  ['a fork', f => { f.context.repo.owner = 'fork'; }],
  ['an untrusted workflow branch', f => { f.context.ref = 'refs/heads/feature'; }],
  ['an automatic PR event', f => { f.context.eventName = 'pull_request'; }],
]) {
  test(`rejects ${name} before status writes or build authorization`, async () => {
    for (const action of [prepare, authorize, report]) {
      const f = fixture(); mutate(f);
      await assert.rejects(action(f));
      assert.equal(f.calls.statuses.length, 0);
      assert.equal(f.calls.outputs.authorized, undefined);
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
  ['ordinary issue rather than PR', f => { delete f.context.payload.issue.pull_request; }],
  ['bot-authored comment', f => { f.context.payload.comment.user.type = 'Bot'; }],
  ['comment author differs from actor', f => { f.context.payload.comment.user.login = 'contributor'; }],
  ['edited comment event', f => { f.context.payload.action = 'edited'; }],
  ['command with extra arguments', f => { f.context.payload.comment.body = '/check-build 112'; }],
  ['quoted command', f => { f.context.payload.comment.body = '> /check-build'; }],
  ['changed live comment', f => { f.comment.body = 'cancel this build'; }],
  ['different live author', f => { f.comment.user.login = 'contributor'; }],
  ['different live issue', f => { f.comment.issue_url = 'https://api.github.com/repos/OWASP/OWASP-Hunting/issues/113'; }],
]) {
  test(`rejects ${name}`, async () => {
    for (const action of [prepare, authorize, report]) {
      const f = fixture(); fromComment(f); mutate(f);
      await assert.rejects(action(f));
      assert.equal(f.calls.statuses.length, 0);
      assert.equal(f.calls.outputs.authorized, undefined);
    }
  });
}

test('accepts whitespace around a standalone comment command and ignores manual PR input', async () => {
  const f = fixture(); fromComment(f, ' \n/check-build\n '); f.env.PR_NUMBER = '999';
  await prepare(f);
  assert.equal(f.calls.outputs.pr_number, '112');
  assert.equal(f.calls.pulls[0].pull_number, 112);
});

test('an owner listed only in a PR-head copy of CODEOWNERS cannot grant authorization', async () => {
  const f = fixture(); f.context.actor = 'contributor'; f.env.GITHUB_TRIGGERING_ACTOR = 'contributor';
  f.github.rest.repos.getContent = async input => {
    assert.equal(input.ref, BASE);
    assert.notEqual(input.ref, SHA);
    return { data: { encoding: 'base64', content: Buffer.from('* @0x5t4l1n').toString('base64') } };
  };
  await assert.rejects(prepare(f), /CODEOWNERS/);
  assert.equal(f.calls.statuses.length, 0);
});

test('authorization is re-evaluated when a listed owner is removed', async () => {
  const f = fixture(); await prepare(f); f.policy.text = '* @other\n';
  await assert.rejects(authorize(f), /CODEOWNERS/);
  const count = f.calls.statuses.length;
  await assert.rejects(report(f), /CODEOWNERS/);
  assert.equal(f.calls.statuses.length, count);
});

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
  test(`publishes ${result} as ${state} on the originally tested SHA`, async () => {
    const f = fixture(); f.env.BUILD_RESULT = result;
    f.pr.head.sha = 'c'.repeat(40);
    await report(f);
    assert.equal(f.calls.statuses[0].sha, SHA);
    assert.equal(f.calls.statuses[0].state, state);
    assert.match(f.calls.summary[0], new RegExp(SHA));
  });
}

test('an unknown outcome cannot be reported as a successful build', async () => {
  const f = fixture(); f.env.BUILD_RESULT = 'pending';
  await assert.rejects(report(f), /Unknown build result/);
  assert.equal(f.calls.statuses.length, 0);
});

test('another listed codeowner may rerun an authorized owner request', async () => {
  const f = fixture(); f.policy.text = '* @0x5t4l1n @second-owner\n';
  f.env.GITHUB_TRIGGERING_ACTOR = 'second-owner';
  await authorize(f);
  assert.deepEqual(f.calls.permissions.map(x => x.username), ['0x5t4l1n', 'second-owner']);
});

test('a deleted request comment fails closed before writing a status', async () => {
  const f = fixture(); fromComment(f);
  f.github.rest.issues.getComment = async () => { throw new Error('Not Found'); };
  await assert.rejects(prepare(f), /Not Found/);
  assert.equal(f.calls.statuses.length, 0);
  assert.equal(f.calls.outputs.authorized, undefined);
});

for (const [result, label] of Object.entries({ success: '✅ Passed', failure: '❌ Failed', cancelled: '⚠️ Cancelled', skipped: '⚠️ Skipped' })) {
  test(`posts ${result} directly to the PR conversation`, async () => {
    const f = fixture(); f.env.BUILD_RESULT = result;
    await report(f);
    assert.equal(f.calls.posted.length, 1);
    assert.equal(f.calls.posted[0].issue_number, 112);
    assert.ok(f.calls.posted[0].body.includes(label));
    assert.ok(f.calls.posted[0].body.includes(SHA));
    assert.ok(f.calls.posted[0].body.includes('https://github.com/OWASP/OWASP-Hunting/actions/runs/123'));
    assert.ok(f.calls.posted[0].body.includes('npm ci'));
    assert.ok(f.calls.posted[0].body.includes('npm run build'));
  });
}

test('repeating a completed report does not duplicate the comment', async () => {
  const f = fixture(); await report(f); await report(f);
  assert.equal(f.calls.posted.length, 1);
  assert.equal(f.calls.updated.length, 0);
});

test('rerunning the same run updates its result comment', async () => {
  const f = fixture(); f.env.BUILD_RESULT = 'failure'; await report(f);
  f.env.BUILD_RESULT = 'success'; await report(f);
  assert.equal(f.calls.posted.length, 1);
  assert.equal(f.calls.updated.length, 1);
  assert.ok(f.calls.updated[0].body.includes('✅ Passed'));
});

test('a separate workflow run gets its own result comment', async () => {
  const f = fixture(); await report(f);
  f.context.runId = 124; await report(f);
  assert.equal(f.calls.posted.length, 2);
  assert.equal(f.calls.updated.length, 0);
});

for (const user of [{ type: 'User', login: 'contributor' }, { type: 'Bot', login: 'another-bot[bot]' }]) {
  test(`does not overwrite a spoofed marker from ${user.login}`, async () => {
    const f = fixture();
    f.resultComments.push({ id: 99, user, body: '<!-- manual-pr-build-result:123 -->\nspoofed' });
    await report(f);
    assert.equal(f.calls.updated.length, 0);
    assert.equal(f.calls.posted.length, 1);
  });
}

test('warns in the PR comment when newer commits are untested', async () => {
  const f = fixture(); f.pr.head.sha = 'c'.repeat(40); await report(f);
  assert.ok(f.calls.posted[0].body.includes('This PR has newer commits'));
  assert.ok(f.calls.posted[0].body.includes(SHA));
});

test('unauthorized reporters cannot create or edit result comments', async () => {
  const f = fixture(); f.env.GITHUB_TRIGGERING_ACTOR = 'contributor';
  await assert.rejects(report(f), /CODEOWNERS/);
  assert.equal(f.calls.posted.length, 0);
  assert.equal(f.calls.updated.length, 0);
});

test('comment API errors fail reporting visibly without losing the build status', async () => {
  const f = fixture();
  f.github.rest.issues.createComment = async () => { throw new Error('Comment permission denied'); };
  await assert.rejects(report(f), /Comment permission denied/);
  assert.equal(f.calls.statuses[0].state, 'success');
});
