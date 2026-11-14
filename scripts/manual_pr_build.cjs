const REPOSITORY = 'OWASP/OWASP-Hunting';
const STATUS_CONTEXT = 'Manual PR build';

function requestNumber(context, env) {
  if (context.eventName === 'workflow_dispatch') return prNumber(env.PR_NUMBER);
  if (
    context.eventName === 'issue_comment' &&
    context.payload.action === 'created' &&
    context.payload.issue?.pull_request &&
    context.payload.comment?.user?.type === 'User' &&
    context.payload.comment.user.login.toLowerCase() === context.actor.toLowerCase() &&
    context.payload.comment.body?.trim() === '/check-build'
  ) {
    return prNumber(String(context.payload.issue.number));
  }
  throw new Error('Use /check-build as a standalone comment on a PR, or dispatch manually.');
}

// This command grants access to explicitly listed user handles, not inferred
// team membership, email addresses, PR authors, or requested reviewers.
function codeownerUsers(text) {
  const users = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    if (!pattern || pattern.startsWith('!') || /[\[\]]/.test(pattern)) continue;
    for (const owner of owners) {
      const match = /^@([a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?)$/i.exec(owner);
      if (match) users.add(match[1].toLowerCase());
    }
  }
  return users;
}

async function authorize({ github, context, env = process.env }) {
  if (`${context.repo.owner}/${context.repo.repo}` !== REPOSITORY || context.ref !== 'refs/heads/main') {
    throw new Error('Run the trusted workflow from OWASP/OWASP-Hunting main.');
  }
  const number = requestNumber(context, env);
  const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: number });
  if (pr.base.ref !== 'website' || pr.base.repo.full_name !== REPOSITORY) {
    throw new Error('Select a PR targeting OWASP/OWASP-Hunting website.');
  }
  const base = headSha(pr.base.sha);
  const { data: file } = await github.rest.repos.getContent({
    ...context.repo, path: '.github/CODEOWNERS', ref: base,
  });
  if (Array.isArray(file) || file.encoding !== 'base64' || typeof file.content !== 'string') {
    throw new Error('Cannot read trusted target-branch CODEOWNERS.');
  }
  const owners = codeownerUsers(Buffer.from(file.content, 'base64').toString('utf8'));
  if (!owners.has(context.actor.toLowerCase()) || !owners.has(env.GITHUB_TRIGGERING_ACTOR?.toLowerCase())) {
    throw new Error('The original requester and rerun requester must both be listed CODEOWNERS.');
  }
  for (const username of new Set([context.actor.toLowerCase(), env.GITHUB_TRIGGERING_ACTOR.toLowerCase()])) {
    const { data: access } = await github.rest.repos.getCollaboratorPermissionLevel({
      ...context.repo, username,
    });
    if (!['admin', 'maintain', 'write'].includes(access.permission)) {
      throw new Error('Listed CODEOWNERS must also have repository write access.');
    }
  }
  if (context.eventName === 'issue_comment') {
    const { data: comment } = await github.rest.issues.getComment({
      ...context.repo, comment_id: context.payload.comment.id,
    });
    if (
      comment.user.type !== 'User' || comment.user.login.toLowerCase() !== context.actor.toLowerCase() ||
      comment.body.trim() !== '/check-build' ||
      comment.issue_url !== `https://api.github.com/repos/${REPOSITORY}/issues/${number}`
    ) {
      throw new Error('The build request comment was changed, deleted, or belongs to another PR.');
    }
  }
  return { number, pr };
}

function prNumber(input) {
  if (!/^[1-9]\d*$/.test(input || '') || !Number.isSafeInteger(Number(input))) {
    throw new Error('PR number must be a positive integer.');
  }
  return Number(input);
}

function headSha(input) {
  if (!/^[0-9a-f]{40}$/.test(input || '')) {
    throw new Error('Expected a full PR commit SHA.');
  }
  return input;
}

function runUrl(context) {
  return `https://github.com/${REPOSITORY}/actions/runs/${context.runId}`;
}

async function setStatus(github, context, sha, state, description) {
  await github.rest.repos.createCommitStatus({
    ...context.repo,
    sha,
    state,
    context: STATUS_CONTEXT,
    description,
    target_url: runUrl(context),
  });
}

async function prepare({ github, context, core, env = process.env }) {
  const { number, pr } = await authorize({ github, context, env });
  if (pr.state !== 'open') throw new Error('Select an open website PR.');
  const sha = headSha(pr.head.sha);
  await setStatus(github, context, sha, 'pending', `Building PR #${number} at ${sha.slice(0, 7)}`);
  core.setOutput('authorized', 'true');
  core.setOutput('head_sha', sha);
  core.setOutput('pr_number', String(number));
  await core.summary.addRaw(
    `## Selected PR build\n\nPR: #${number}\n\nCommit: \`${sha}\`\n\n[Build run](${runUrl(context)})\n`,
  ).write();
}

async function commentResult({ github, context, number, sha, result, newerHead }) {
  const marker = `<!-- manual-pr-build-result:${context.runId} -->`;
  const labels = { success: '✅ Passed', failure: '❌ Failed', cancelled: '⚠️ Cancelled', skipped: '⚠️ Skipped' };
  const body = [
    marker,
    `### PR build check: ${labels[result]}`,
    '',
    `- **Tested commit:** \`${sha}\``,
    '- **Commands:** `npm ci` and `npm run build`',
    `- **Full output:** [View build log](${runUrl(context)})`,
    '',
    newerHead
      ? '⚠️ This PR has newer commits. This result covers only the tested commit above; request a new build for the current head.'
      : 'This result covers the tested commit above. New commits require another `/check-build` run.',
  ].join('\n');
  const comments = await github.paginate(github.rest.issues.listComments, {
    ...context.repo, issue_number: number, per_page: 100,
  });
  const existing = comments.find(comment =>
    comment.user?.type === 'Bot' && comment.user.login === 'github-actions[bot]' &&
    comment.body?.startsWith(marker),
  );
  if (existing) {
    if (existing.body !== body) {
      await github.rest.issues.updateComment({ ...context.repo, comment_id: existing.id, body });
    }
  } else {
    await github.rest.issues.createComment({ ...context.repo, issue_number: number, body });
  }
}

async function report({ github, context, core, env = process.env }) {
  const { number, pr } = await authorize({ github, context, env });
  const sha = headSha(env.PR_HEAD_SHA);
  const states = { success: 'success', failure: 'failure', cancelled: 'error', skipped: 'error' };
  const state = states[env.BUILD_RESULT];
  if (!state) throw new Error('Unknown build result; refusing to publish a passing status.');
  await setStatus(github, context, sha, state, `PR #${number} build: ${env.BUILD_RESULT}`);
  await commentResult({ github, context, number, sha, result: env.BUILD_RESULT, newerHead: pr.head.sha !== sha });
  await core.summary.addRaw(
    `## PR #${number} build: ${env.BUILD_RESULT}\n\nTested commit: \`${sha}\`\n\n[Build log](${runUrl(context)})\n\nThis result applies only to this commit. New pushes require another manual run.\n`,
  ).write();
}

module.exports = { prepare, report, authorize };
