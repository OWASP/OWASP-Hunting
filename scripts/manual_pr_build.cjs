const REPOSITORY = 'OWASP/OWASP-Hunting';
const OPERATOR = '0x5t4l1n';
const STATUS_CONTEXT = 'Manual PR build';

function authorize(context, env) {
  if (
    context.eventName !== 'workflow_dispatch' ||
    context.actor.toLowerCase() !== OPERATOR ||
    env.GITHUB_TRIGGERING_ACTOR?.toLowerCase() !== OPERATOR ||
    `${context.repo.owner}/${context.repo.repo}` !== REPOSITORY ||
    context.ref !== 'refs/heads/main'
  ) {
    throw new Error('Only 0x5t4l1n may run this workflow from OWASP/OWASP-Hunting main.');
  }
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
  authorize(context, env);
  const number = prNumber(env.PR_NUMBER);
  const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: number });
  if (pr.state !== 'open' || pr.base.ref !== 'website' || pr.base.repo.full_name !== REPOSITORY) {
    throw new Error('Select an open PR targeting OWASP/OWASP-Hunting website.');
  }
  const sha = headSha(pr.head.sha);
  await setStatus(github, context, sha, 'pending', `Building PR #${number} at ${sha.slice(0, 7)}`);
  core.setOutput('head_sha', sha);
  core.setOutput('pr_number', String(number));
  await core.summary.addRaw(
    `## Selected PR build\n\nPR: #${number}\n\nCommit: \`${sha}\`\n\n[Build run](${runUrl(context)})\n`,
  ).write();
}

async function report({ github, context, core, env = process.env }) {
  authorize(context, env);
  const number = prNumber(env.PR_NUMBER);
  const sha = headSha(env.PR_HEAD_SHA);
  const states = { success: 'success', failure: 'failure', cancelled: 'error', skipped: 'error' };
  const state = states[env.BUILD_RESULT];
  if (!state) throw new Error('Unknown build result; refusing to publish a passing status.');
  await setStatus(github, context, sha, state, `PR #${number} build: ${env.BUILD_RESULT}`);
  await core.summary.addRaw(
    `## PR #${number} build: ${env.BUILD_RESULT}\n\nTested commit: \`${sha}\`\n\n[Build log](${runUrl(context)})\n\nThis result applies only to this commit. New pushes require another manual run.\n`,
  ).write();
}

module.exports = { prepare, report };
