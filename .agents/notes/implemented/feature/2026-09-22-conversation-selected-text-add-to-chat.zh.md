# 将会话选中文本添加到当前聊天

Status: implemented
Translation: current

[English](2026-09-22-conversation-selected-text-add-to-chat.md)

## 摘要

会话选中文本此前已有原生选区保活和复制处理，但无法把摘录继续用于当前 composer。现在，session
stream 会为非空的原生选区显示浮动的 `Add to chat` 操作，composer 会将每个摘录显示为可移除的 chip，
且不会覆盖已有草稿。提交时，chip 会展平为现有的普通文本输入。本次变更只覆盖当前 session；
`Ask in side chat` 仍不在范围内。

## 决策

既有 native-selection hook 负责提供选中文本和相对于 viewport 的 range 矩形，使 toolbar 与虚拟化保活
使用同一生命周期，并在选区释放时消失。session interface 把一个 callback 传入 stream；input area 负责
pending reference state、chip 移除、聚焦以及提交时展平。空选区会被忽略。结构化的
`conversation_text_reference` input block 等 server 与 transcript contract 准备好后再实现。

## 证据与限制

`conversation-text-selection.test.tsx` 验证了选中文本发布和释放；
`session-chat-input-submission.test.tsx` 覆盖 chip 创建、移除、草稿保留和普通文本发送。Formatter 与
diff checks 已通过；delivery 阶段会运行 package tests 和 typecheck。
