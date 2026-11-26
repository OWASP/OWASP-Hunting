const fs = require('node:fs');

const MARKER = '<!-- pr-template-check -->';
const DISCLOSURE = 'AI-Assisted Contribution Disclosure';

function visible(text) {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, '');
}

function sections(text) {
  const result = new Map();
  let current;
  let fence;
  for (const line of visible(text).replace(/\r\n?/g, '\n').split('\n')) {
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (delimiter && delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length &&
          line.trim() === delimiter[1]) {
        fence = undefined;
        continue;
      }
      // Code examples count as section content, never as headings or checkboxes.
      if (current && line.trim()) result.get(current).push('CODE_EXAMPLE');
      continue;
    }
    if (delimiter) {
      fence = delimiter[1];
      continue;
    }
    const heading = line.match(/^ {0,3}##[ \t]+(.+?)[ \t]*#*[ \t]*$/);
    if (heading) {
      current = heading[1].trim();
      if (result.has(current)) throw new Error(`Use only one "${current}" section.`);
      result.set(current, []);
    } else if (current) {
      result.get(current).push(line);
    }
  }
  return result;
}

function plain(text) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();
}

function checklist(lines) {
  return lines.flatMap(line => {
    const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/);
    return match ? [{ checked: match[1].toLowerCase() === 'x', text: plain(match[2]) }] : [];
  });
}

function meaningful(value) {
  const text = plain(value);
  return Boolean(text) && !/^(?:n\/?a|none|tbd|todo|unknown|\.\.\.|-|<[^>]*>)\.?$/i.test(text);
}

function validate(body, template) {
  const expected = sections(template);
  let actual;
  try { actual = sections(body || ''); } catch (error) { return [error.message]; }
  const errors = [];
  for (const [name, templateLines] of expected) {
    if (!actual.has(name)) {
      errors.push(`Add the "${name}" section.`);
      continue;
    }
    const lines = actual.get(name);
    const boxes = checklist(lines);
    if (name === DISCLOSURE) {
      const choices = checklist(templateLines).map(choice => choice.text);
      const selected = boxes.filter(box => box.checked && choices.includes(box.text));
      if (selected.length !== 1) errors.push('Select exactly one AI-assistance checkbox.');
      if (selected.some(box => box.text === choices[1])) {
        for (const field of ['Tool/model', 'Provider', 'What it helped with', 'Human validation performed']) {
          const value = lines.map(plain).map(line => line.replace(/^[-*]\s*/, ''))
            .find(line => line.startsWith(`${field}:`))?.slice(field.length + 1).trim();
          const unknownAllowed = ['Tool/model', 'Provider'].includes(field) && value?.toLowerCase() === 'unknown';
          if (!unknownAllowed && !meaningful(value || '')) errors.push(`Complete "${field}" in the AI disclosure.`);
        }
      }
    } else if (checklist(templateLines).length) {
      for (const expectedBox of checklist(templateLines)) {
        const matches = boxes.filter(box => box.text === expectedBox.text);
        if (matches.length !== 1 || !matches[0].checked) errors.push(`Confirm "${expectedBox.text}" under "${name}".`);
      }
    } else {
      const content = lines.join('\n').trim();
      const canBeNA = name === 'Source Attribution and References';
      if (!meaningful(content) && !(canBeNA && /^n\/?a\.?$/i.test(content))) {
        errors.push(`Fill in "${name}" (template instructions alone do not count).`);
      }
    }
  }
  return errors;
}

function commentBody(errors, templateURL) {
  return errors.length
    ? `${MARKER}\n### Please correct the PR description\n\nUse the [PR template](${templateURL}) and fix the following:\n\n${errors.map(error => `- ${error}`).join('\n')}\n\nAutomated checks and automatic reviewer requests are paused. Edit this PR's description; the check will rerun automatically. For documentation-only changes, confirm you checked for duplicates and use N/A for sources if none apply.\n\nOnly confirm statements that are true. Select either AI disclosure option; AI use itself does not cause rejection.`
    : `${MARKER}\n### PR template check passed\n\nThe description has all required sections and confirmations. Automated checks can now run. Non-draft PRs can be sent for review.`;
}

async function run({ github, context, core, report = true, templatePath = '.github/PULL_REQUEST_TEMPLATE.md' }) {
  const { owner, repo } = context.repo;
  const pull_number = context.payload.pull_request.number;
  // Read the current body, including when a maintainer reruns an older workflow.
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number });
  if (pr.state !== 'open' || pr.head.sha !== context.payload.pull_request.head.sha ||
      pr.base.ref !== context.payload.pull_request.base.ref) {
    core.setFailed('PR state changed; use the check for its latest revision.');
    return;
  }
  const errors = validate(pr.body, fs.readFileSync(templatePath, 'utf8'));
  if (report) {
    const issue_number = pull_number;
    const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number, per_page: 100 });
    const existing = comments.find(comment => comment.user?.login === 'github-actions[bot]' &&
      comment.user?.type === 'Bot' && comment.body?.startsWith(MARKER));
    const body = commentBody(errors, `https://github.com/${owner}/${repo}/blob/${encodeURIComponent(pr.base.ref)}/.github/PULL_REQUEST_TEMPLATE.md`);
    if (existing && existing.body !== body) {
      await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
    } else if (!existing && errors.length) {
      await github.rest.issues.createComment({ owner, repo, issue_number, body });
    }
    const reviewers = JSON.parse(fs.readFileSync('.github/pr-reviewers.json', 'utf8'));
    const requested = new Set(pr.requested_reviewers.map(user => user.login.toLowerCase()));
    if (errors.length || pr.draft) {
      const remove = reviewers.filter(login => requested.has(login.toLowerCase()));
      if (remove.length) await github.rest.pulls.removeRequestedReviewers({ owner, repo, pull_number, reviewers: remove });
    } else {
      const reviews = await github.paginate(github.rest.pulls.listReviews, { owner, repo, pull_number, per_page: 100 });
      const reviewed = new Set(reviews.filter(review => ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'].includes(review.state))
        .map(review => review.user.login.toLowerCase()));
      const add = reviewers.filter(login => login.toLowerCase() !== pr.user.login.toLowerCase() &&
        !requested.has(login.toLowerCase()) && !reviewed.has(login.toLowerCase()));
      if (add.length) await github.rest.pulls.requestReviewers({ owner, repo, pull_number, reviewers: add });
    }
  }
  if (errors.length) core.setFailed(errors.join('\n'));
  else core.info('PR template check passed.');
}

module.exports = { validate, commentBody, run };
