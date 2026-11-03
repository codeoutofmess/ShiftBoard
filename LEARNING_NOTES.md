# CI/CD learning notes

Private revision notes for explaining the ShiftBoard pipeline in an interview.
How I describe it: **"I set up a CI/CD pipeline for a personal project."** Not production
experience.

## The big picture in one paragraph

On every push and PR, GitHub Actions runs two parallel jobs (backend, frontend) that must
pass. Deploys happen from `main` only. Render is told to deploy only after CI checks pass.
Vercel deploys `main` by itself, so the thing keeping red code off `main` is branch
protection (PRs + required checks), not Vercel.

```
feature branch -> push -> CI runs (backend + frontend)
                      \-> open PR -> CI must be green to merge (branch protection)
merge to main -> CI runs again on main
                 |-> Render: waits for the checks, deploys only if they passed
                 \-> Vercel: deploys main (does not wait for CI itself)
```

## What each workflow step does (`.github/workflows/ci.yml`)

### Top-level settings

| Setting | What it does | Why it exists |
| --- | --- | --- |
| `on: push, pull_request` | Runs on every push to any branch and on every PR | Feedback before merge, and a result on every `main` commit (Render needs this) |
| `permissions: contents: read` | The auto-generated `GITHUB_TOKEN` can only read the repo | Least privilege: a compromised step or action can't push code or edit releases |
| `concurrency` | New push to the same branch cancels the older still-running run | Saves minutes and avoids confusing stale results. Not cancelled on `main`, so every main commit gets a final result for Render |
| `timeout-minutes: 15` | Kills a hung job | Stops a stuck job burning minutes |
| Pinned SHAs (`uses: ...@3d3c42e...  # v7.0.1`) | Locks each action to one exact commit | Tags can be moved; a SHA can't. Protects against a hijacked action version |

### Backend job (.NET 8)

1. **checkout**: downloads the repo onto the fresh runner machine.
2. **setup-dotnet (8.0.x, cache)**: installs the SDK matching the project and caches NuGet
   packages (keyed on the `.csproj` files) so later runs skip downloads.
3. **`dotnet restore ShiftBoard.sln`**: downloads NuGet packages.
4. **`dotnet build ... --no-restore`**: compiles API and tests in Release. Catches compile
   errors.
5. **`dotnet test ... --no-build`**: runs the xUnit tests against the build from step 4.
   A single failing test fails the job.

### Frontend job (React + TypeScript)

1. **checkout**, then **setup-node (22, npm cache)**: installs Node and caches npm downloads
   (keyed on `package-lock.json`).
2. **`npm ci`**: clean install that follows `package-lock.json` exactly (unlike `npm install`,
   which may change it). Reproducible and fails if the lock file is out of sync.
3. **`npm run lint`**: oxlint finds suspicious code (e.g. React hooks rule violations).
4. **`npm run typecheck`**: `tsc -b` finds type errors. It is a separate step so a type error is
   labelled as such. `build` would also catch it.
5. **`npm run build`**: production Vite build. Proves the app actually bundles.

## What the tests actually test (and don't)

`ShiftBoard.Api.Tests`, 5 test methods that run as 8 cases:

- **`ShiftRequest` validation**: end time must be after start time (valid, equal, and earlier
  are all covered).
- **Overlap rule through the real `ShiftsController`** against in-memory **SQLite** (real SQL,
  not EF's InMemory fake): overlap returns 409; back-to-back shifts are allowed on both
  sides; same time for a different employee is allowed; editing a shift doesn't conflict
  with itself.

I checked the tests can fail: I temporarily flipped each comparison in the overlap query
(`<` to `<=`, `>` to `>=`). My first version missed one of these (the "ends exactly when the
other starts" case), so I added it. Both mutations are now caught.

**Not tested:** auth/JWT, role guards, other controllers, the frontend (no test runner), the
database migrations, and the deployed app.

## Deployment: what protects what

- **Render (`render.yaml`: `branch: main`, `autoDeployTrigger: checksPass`)**: Render waits for
  the commit's GitHub checks and deploys only if they pass. Documented quirks: if a commit
  has **no** checks, Render skips the deploy; a check that concluded "skipped" counts as
  passing. The Blueprint file sets this, so it only takes effect once the change is on `main`
  and Render has synced it.
- **Vercel (Git integration, unchanged)**: deploys `main` and builds previews for branches/PRs.
  It does **not** wait for GitHub Actions. The protection is indirect: branch protection
  means nothing reaches `main` without a green PR.
  - Gap: someone with admin rights can bypass protection and push straight to `main`, and
    Vercel would deploy it regardless of CI.
  - The stronger alternative (deploy from the workflow with the Vercel CLI and secrets) was
    considered and not chosen. More moving parts and three secrets for a hobby project.

## The 5 questions an interviewer might ask

**1. What happens when a test fails?**
The backend job goes red and the PR shows a failed check. With branch protection requiring
those checks, the merge button is blocked, so the change can't reach `main`. If it somehow
did reach `main`, Render would skip the deploy because its checks failed. Vercel would not
skip it by itself, which is exactly the gap I'd close next.

**2. How do you make sure only tested code gets deployed?**
Two layers, and I'm clear which is which. Render checks the CI result itself
(`checksPass`). For Vercel it's indirect: PRs and required checks on `main`, then Vercel
deploys `main`. It is not a hard gate like a deploy job that depends on CI jobs. That would be
the stronger design.

**3. Why pin actions to SHAs and set `permissions: contents: read`?**
Supply-chain safety. Tags like `v4` can be moved to point at different code; a commit SHA
can't. And the workflow token only needs to read the repo, so if an action were compromised
it couldn't write to it. The cost is that I have to update SHAs by hand (Dependabot could do
that; I haven't set it up).

**4. How would you roll back a bad deploy?**
Honestly: not set up or practised. Options exist: `git revert` the commit through a PR and let
the pipeline redeploy, and both Render and Vercel let you redeploy an earlier deploy from their
dashboards. I haven't tested either for this project, and the free-tier database resets on
deploy anyway.

**5. What would you add next?**
In order: (a) build the Docker image in CI, because today the Dockerfile is only
exercised on Render; (b) Dependabot / dependency and secret scanning; (c) tests for auth and
role guards plus a few frontend tests; (d) make the Vercel deploy a real gate (deploy from the
workflow after CI) or at least confirm protections apply to admins; (e) a staging environment
and basic monitoring.

## What this does NOT cover (don't overclaim)

- **No staging environment.** Merging to `main` goes straight to the live demo.
- **No automated rollback** and no tested rollback process.
- **No monitoring, logging, or alerting.** I wouldn't know if the live site broke.
- **No Docker image build in CI.** A Dockerfile mistake would only show up when Render builds.
- **No integration/end-to-end tests** and **no frontend tests**; backend tests cover one rule
  area (shift validation and overlap). No coverage measurement.
- **No security scanning** (dependency audit, secret scanning, static analysis). The known
  `react-router-dom` advisory is documented in the README, not enforced here.
- **Vercel is not hard-gated by CI** (see above).
- **No database migration or deploy-time checks.**
- **GitHub branch protection is a setting, not code in the repo.** If it's off or bypassed,
  the PR gate doesn't exist.
- **Not production experience.** One small app, free tiers, one developer, no on-call, no
  real users, no team review process.

## Useful commands

```bash
dotnet test ShiftBoard.sln                       # backend tests locally
cd ShiftBoard.Web && npm run lint && npm run typecheck && npm run build
gh run list --limit 5                            # recent CI runs
gh run view <run-id> --log-failed                # why a run failed
```
