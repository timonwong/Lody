# Add selected conversation text to the current chat

Status: implemented
Translation: current

[中文](2026-09-22-conversation-selected-text-add-to-chat.zh.md)

## Abstract

Selected conversation text previously had native retention and copy handling,
but no action for continuing with the excerpt in the current composer. The
session stream now exposes a floating `Add to chat` action for non-empty native
selections, and the composer renders each excerpt as a removable chip without
replacing an existing draft. On submit, chips are flattened into the existing
ordinary text input. The action is deliberately limited to the current session;
`Ask in side chat` remains outside this change.

## Decision

The existing native-selection hook owns the selected text and viewport-relative
range rectangle so the toolbar follows the same lifecycle as virtualization
retention and disappears when the selection is released. The session interface
passes one callback into the stream; the input area owns pending reference state,
chip removal, focus, and flattening on submit. Empty selections are ignored.
The structured `conversation_text_reference` input block is intentionally
deferred until its server and transcript contracts are available.

## Evidence and limits

`conversation-text-selection.test.tsx` asserts selected text publication and
release. `session-chat-input-submission.test.tsx` covers chip creation, removal,
draft preservation, and ordinary-text submission. Formatter and diff checks
passed; package tests and typecheck are run during delivery.
