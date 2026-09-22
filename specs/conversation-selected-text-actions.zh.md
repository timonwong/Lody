# 会话选中文本操作

Status: draft
Translation: current

[English](conversation-selected-text-actions.md)

## 场景

用户在会话中选中可读文本后，希望在当前 composer 中继续处理这段摘录。
会话在原生选区保持期间提供浮动的 `Add to chat` 操作。

## 交互

`Add to chat` 将选中文本原样保留在可移除的 composer chip 中，然后聚焦 composer。多个摘录保持为独立
的 chip，移除 chip 不会改变用户已输入的草稿。提交时，选中的摘录会在用户草稿之后以一个空行连接，
并沿用现有的普通文本输入发送。空选区或只包含空白的选区不显示该操作。选中文本不会在用户提交
composer 之前发送、持久化或被解释为新消息。

当前实现刻意保持现有的 text submission protocol。结构化的
`conversation_text_reference` input block 等 server 与 transcript contract 准备好后再实现。

当前范围不包含 `Ask in side chat` 或其他选区操作。

## 证据

该行为由 `useConversationTextSelection`、`SessionChatStream`、`SessionChatInputArea` 和
`ConversationTextReferenceChip` 实现。focused tests 覆盖 chip 创建、移除、保留草稿以及普通文本发送。
