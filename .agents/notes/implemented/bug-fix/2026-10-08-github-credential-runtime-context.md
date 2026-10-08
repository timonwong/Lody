# GitHub credential adapter runtime and context ownership

Status: implemented
Translation: current

[中文](2026-10-08-github-credential-runtime-context.zh.md)

## Abstract

Lody-generated Git and gh adapters started through PATH `node`, so managed checkouts
failed before the agent started on desktop hosts without Node. Separately, an abandoned
speculative preparation could leave a broker context under a session ID, and turn-start
refresh treated it as managed enrollment, failing a later local-project turn with
`github_context_missing`. Adapters now re-execute under the CLI's own runtime; broker
contexts are leases released by unadopted preparations, and refresh skips local
projects as preparation does. Tests were written but not run by the authoring agent,
and the desktop interaction that left the stale context is inferred, not reproduced.

## Adapter runtime

Confirmed on macOS: with only system directories on PATH, the generated Git wrapper
exited 127 (`env: node: No such file or directory`); the same file under an explicit
Node printed the Git version. The desktop runs the CLI as Electron's helper with
`ELECTRON_RUN_AS_NODE=1`.

`lib/host-node-launcher.ts` emits a two-line sh/CommonJS preamble for the Git wrapper,
HTTP adapters and gh shim: sh re-executes the file under the quoted runtime path (setting
Electron's Node mode), and Node reads the second line as a directive plus comment. File
names, `__filename`, `.cmd` entry points and vm-based tests are unchanged. The credential
helper command and diagnostic helper probe use the same runtime.

Rejected: an absolute-path shebang cannot hold the spaces in `Lody Helper.app` paths or
set Electron's mode; separate sh launchers with `.cjs` bodies add files and break the gh
shim's `__filename` self-exclusion; adding Lody's runtime to PATH would replace the
user's own `node`. Generated files embed the runtime path and are rewritten by each
managed preparation, so a relocated app takes effect in the next session.

## Broker context ownership

Confirmed: the failing turn logged `execution.refresh_gh_token status=error
durationMs=0` after the same local session's first refresh succeeded. Running the
installed bundle's own preparation, membership, refresh and policy methods, a local
session without a policy failed only when a context existed for its ID. In source,
membership was refresh's only gate, preparation registered its context before its final
abort check, and cleanup never revoked it. Inferred: cancellation and claim misses do
not wait for in-flight credential setup, so an abandoned managed preparation can
register after a cold-started local session's first refresh.

`GitCredentialBroker.acquireSessionContext` returns an idempotent lease counted per
session ID; the last release revokes the current token and files, even after owner
rotation. Preparation acquires last, releases on abort, failure or unadopted disposal,
and hands the lease over on adoption. Durable sessions keep contexts until shutdown,
whose generation bump stops older leases releasing newer contexts. Refresh returns for
local projects before checking membership; managed sessions without a policy still fail
closed, and owner changes still terminate old processes.

Rejected: removing the missing-policy guard or giving local sessions a policy would hide
managed setup errors or enroll local sessions; revoking on every disposal would let a
late disposal revoke the replacing session's shared token; gating only on the live
policy would drop the managed fail-closed check.

Limits: durable contexts are still not released on session termination, and a stale
preparation resolving a different owner still rotates the token.

## Verification

Regression suites cover an empty PATH, runtime paths with spaces, both runtime modes,
real `git credential fill`, broker leases and the preparation lifecycle. They were not
executed in the authoring environment, and no packaged macOS or Windows run was done.
Related: [local native authentication](../feature/2026-09-29-local-project-native-github-auth.md),
[command credentials](../architecture/2026-09-26-github-command-credentials.md),
issue [#1307](https://github.com/LodyAI/Lody/issues/1307).
