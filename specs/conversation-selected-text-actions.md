# Conversation selected-text actions

Status: draft
Translation: current

[中文](conversation-selected-text-actions.zh.md)

## Scenario

A user selects readable text in a session conversation and wants to continue
working with that excerpt in the current composer. The conversation offers a
floating `Add to chat` action while the native selection remains active.

## Interaction

`Add to chat` preserves the selected text in a removable composer chip and then
focuses the composer. Multiple excerpts remain separate chips, and removing a
chip does not change the typed draft. On submit, the selected excerpts are
flattened after the typed draft with one blank line between values and sent as
the existing ordinary text input. An empty or whitespace-only selection does not
show the action. The selection must not be sent, persisted, or interpreted as a
new message until the user submits the composer.

The current implementation intentionally keeps the existing text submission
protocol. A structured `conversation_text_reference` input block is deferred
until the server and transcript contracts are ready for it.

The current scope does not include `Ask in side chat` or other selection actions.

## Evidence

The behavior is implemented by `useConversationTextSelection`,
`SessionChatStream`, `SessionChatInputArea`, and
`ConversationTextReferenceChip`. Focused tests cover chip creation, removal,
draft preservation, and ordinary-text submission.
