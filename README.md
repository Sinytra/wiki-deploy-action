# Modded Minecraft Wiki deploy action

Deploys a [Modded Minecraft Wiki](https://moddedmc.wiki) project. The wiki pulls the project's source repository
by itself after the deployment is triggered. The action waits for the deployment to finish and fails the job if it
errors.

## Usage

### With GitHub OIDC (recommended)

No secret is needed. The wiki checks that the workflow runs in the project's authorized source repository, on the
configured source branch.

```yaml
on:
  push:
    branches: [master]
    paths: ['wiki/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
    steps:
      - uses: sinytra/wiki-deploy-action@v1
        with:
          project: my-project-id
```

### With a personal access token

If the workflow can't run in the project's source repository or branch, specify your own PAT instead.

1. Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) as a member of
   the wiki project. No permissions are necessary, as the wiki only uses it to read your public profile and verify your
   identity.
2. Add it to the repository as an Actions secret, e.g. `WIKI_DEPLOY_TOKEN`.

The use it as follows in your workflow step:
```yaml
      - uses: sinytra/wiki-deploy-action@v1
        with:
          project: my-project-id
          token: ${{ secrets.WIKI_DEPLOY_TOKEN }}
```

If your token expires, the action will fail with a message asking you to create a new one.

## Inputs

| Input     | Required | Description                                              |
|-----------|----------|----------------------------------------------------------|
| `project` | yes      | Wiki project ID                                          |
| `token`   | no       | PAT of a project member. Leave empty to use GitHub OIDC. |
