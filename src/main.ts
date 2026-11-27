import * as core from '@actions/core';

interface ErrorBody {
  error?: string;
  message?: string;
}

const API_URL = 'https://api.moddedmc.wiki';
const OIDC_AUDIENCE = 'https://moddedmc.wiki';

async function run(): Promise<void> {
  const project = core.getInput('project', { required: true });
  const pat = core.getInput('token');

  const usingOidc = !pat;
  const headers: Record<string, string> = usingOidc
    ? { 'X-GitHub-OIDC-Token': await requestOidcToken(OIDC_AUDIENCE) }
    : { 'X-GitHub-Token': pat };

  core.info(`Deploying ${project}...`);

  const endpoint = new URL(`/api/v1/dev/projects/${encodeURIComponent(project)}/deploy`, API_URL);
  const response = await fetch(endpoint, { method: 'POST', headers }).catch((e: unknown) => {
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : String(e);
    throw new Error('Failed to reach the wiki: ' + cause);
  });

  const body: ErrorBody = await response.json().catch(() => ({}));
  if (response.ok) {
    core.info(`${project} deployed successfully`);
    return;
  }

  switch (response.status) {
    case 400:
      if (body.error === 'pending_deployment') {
        core.warning('A deployment of this project is already in progress');
        return;
      }
      if (body.message) {
        throw new Error(`Deployment failed (${body.error}): ${body.message}`);
      }
      break;
    case 401:
      throw new Error(
        usingOidc
          ? 'The OIDC token was rejected by the wiki.'
          : 'The token was rejected. Has it expired? Please create a new PAT and update the secret.'
      );
    case 403:
      throw new Error(
        "This workflow's repository or branch doesn't match the project's configured source repository and branch."
      );
    case 404:
      throw new Error(
        usingOidc
          ? `Project '${project}' was not found.`
          : `Project '${project}' was not found, or the token's user is not a member of it.`
      );
    case 500:
      throw new Error('Deployment failed due to an internal wiki error. Check the deployment log on the wiki.');
  }

  throw new Error(`Deployment failed (${response.status}): ${JSON.stringify(body)}`);
}

async function requestOidcToken(audience: string): Promise<string> {
  try {
    return await core.getIDToken(audience);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Failed to request an OIDC token. Add 'permissions: id-token: write' to the workflow job, or pass a 'token' input. (${reason})`
    );
  }
}

run().catch(e => core.setFailed(e instanceof Error ? e.message : String(e)));
