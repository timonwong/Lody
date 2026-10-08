# GitHub credential adapter runtime and context ownership

Status: implemented
Translation: current

[中文](2026-10-08-github-credential-runtime-context.zh.md)

## Abstract

Two defects blocked GitHub sessions. Lody-generated Git and gh adapters started with
`#!/usr/bin/env node`, so a managed checkout failed before the agent started whenever
the desktop user's PATH had no Node. Separately, an abandoned speculative preparation
could leave a broker context registered under a session ID, and turn-start refresh
treated that membership as managed enrollment, failing a later local-project turn with
`github_context_missing`. Generated adapters now re-execute under the runtime running the
CLI, keeping Electron's Node mode; broker contexts are leases that unadopted preparations
release, and refresh skips local projects exactly as preparation does. The regression
tests were written but not executed by the authoring agent, and the desktop interaction
that produced the stale context was not reproduced end to end.

## Adapter runtime

Evidence: on macOS, the generated Git wrapper exited 127 with
`env: node: No such file or directory` when PATH held only system directories; the same
file run by an explicit Node binary under the same PATH printed the Git version. The
desktop embeds the CLI in Electron's helper with `ELECTRON_RUN_AS_NODE=1`, and the
Windows `.cmd` launchers already named `process.execPath`.

`lib/host-node-launcher.ts` now owns how Lody-generated scripts start. The Git wrapper,
both HTTP transport adapters and the gh shim begin with a two-line sh/CommonJS preamble:
sh re-executes the file under the quoted runtime path, setting `ELECTRON_RUN_AS_NODE`
for Electron, while Node strips the hashbang and reads the second line as a directive
plus comment. File names, `__filename`/`__dirname`, the `.cmd` entry points and the
vm-based adapter tests keep working. The Git credential helper `!` command and the
diagnostic helper probe use the same runtime.

Alternatives: an absolute-path shebang cannot carry the spaces in packaged
`Lody Helper.app` paths or set Electron's mode. Separate sh launchers plus `.cjs` bodies
add files and change the gh shim's self-exclusion by `__filename`. Appending Lody's
runtime directory to the session PATH would substitute it for the user's own `node`;
only Lody-owned launchers change, and user tools keep their PATH Node.

Generated files embed the runtime path. Each managed preparation rewrites them, so an
update that moves the app is reflected by the next session.

## Broker context ownership

Evidence: the failing turn logged `execution.refresh_gh_token status=error durationMs=0`
after the first turn of the same local-project session had refreshed normally. Using
the installed bundle's own preparation, membership, refresh and policy methods, a local
session without a policy succeeded with no broker context and failed when a context
existed for its session ID. In source, membership was the only refresh gate,
preparation registered its context before its final abort check, and preparation
cleanup never revoked contexts. Cancelling a preparation or missing its claim does not
wait for in-flight credential setup, so an abandoned managed preparation can register
the context after a cold-started local session's first refresh. That sequence matches
the log but is an inference; the user interaction that started it is unconfirmed.

`GitCredentialBroker.acquireSessionContext` returns an idempotent lease and counts
holders per session ID; the last release revokes the current token and its context
files, including a token rotated by an owner change. Preparation acquires after all
other setup, releases on abort, failure or unadopted disposal, and hands the lease to
the durable session on adoption. Durable sessions keep contexts until broker shutdown,
as before; shutdown advances a generation so older leases cannot release newer
contexts. Refresh returns for local projects before consulting membership. Managed
sessions with a context but no policy still fail closed, and owner changes still
terminate the old processes.

Alternatives: removing or swallowing the missing-policy guard, or giving local sessions
a policy, would hide real managed setup errors or enroll local sessions. Revoking on
every preparation disposal is unsafe because the same owner reuses one token, so a late
disposal would revoke the replacing session's context. Gating refresh only on the live
policy would drop the managed fail-closed check.

Remaining limits: durable contexts are still not released when a session terminates. A
stale preparation that resolves a different owner still rotates the token, as before.

## Verification

Written, not executed here because the authoring environment prohibited Node test runs:
`host-node-launcher.test.ts` (empty PATH, runtime path with spaces, both runtime modes,
real `git credential fill`), new cases in `github-git-transport.test.ts` and
`gh-shim-script.test.ts`, broker lease cases in `git-credential-broker.test.ts`, and the
preparation lifecycle suite `session-manager-github-context.test.ts`. No packaged macOS
or Windows run was performed. Related decisions:
[local native authentication](../feature/2026-09-29-local-project-native-github-auth.md)
and [command credentials](../architecture/2026-09-26-github-command-credentials.md).
Issue: [#1307](https://github.com/LodyAI/Lody/issues/1307).
