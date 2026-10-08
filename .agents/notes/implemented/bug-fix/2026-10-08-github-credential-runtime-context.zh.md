# GitHub 凭据适配器运行时与上下文归属

Status: implemented
Translation: current

[English](2026-10-08-github-credential-runtime-context.md)

## 摘要

两个缺陷阻断了 GitHub 会话。Lody 生成的 Git 与 gh 适配器以 `#!/usr/bin/env node` 启动，
桌面用户 PATH 中没有 Node 时，托管 checkout 会在 Agent 启动前失败。另一方面，被放弃的预准备
可能在某个会话 ID 下留下 broker 上下文，而轮次开始时的刷新把这种成员关系当作托管注册，使之后的
本地项目轮次以 `github_context_missing` 失败。生成的适配器现在改由运行 CLI 的运行时重新执行，
并保留 Electron 的 Node 模式；broker 上下文改为租约，未被接管的预准备会释放它，刷新也像预准备
一样跳过本地项目。回归测试已编写，但作者 Agent 未执行；产生残留上下文的桌面交互也未端到端复现。

## 适配器运行时

证据：在 macOS 上，PATH 只含系统目录时，生成的 Git 包装脚本以 127 退出并报
`env: node: No such file or directory`；相同 PATH 下用显式 Node 运行同一文件则输出 Git 版本。
桌面应用在 Electron helper 中以 `ELECTRON_RUN_AS_NODE=1` 运行内嵌 CLI，Windows 的 `.cmd`
启动器原本就使用 `process.execPath`。

现在由 `lib/host-node-launcher.ts` 决定 Lody 生成脚本如何启动。Git 包装脚本、两个 HTTP 传输
适配器和 gh shim 以两行 sh/CommonJS 前导开头：sh 用带引号的运行时路径重新执行该文件，Electron
下同时设置 `ELECTRON_RUN_AS_NODE`；Node 去掉 hashbang 后把第二行读作指令加注释。文件名、
`__filename`/`__dirname`、`.cmd` 入口以及基于 vm 的适配器测试都保持可用。Git 凭据 helper 的
`!` 命令和诊断 helper 探测也使用同一运行时。

备选方案：绝对路径 shebang 无法承载打包后 `Lody Helper.app` 路径中的空格，也不能设置 Electron
模式。独立 sh 启动器加 `.cjs` 主体会增加文件，并改变 gh shim 依赖 `__filename` 的自我排除。
把 Lody 运行时目录加入会话 PATH 会用它替代用户自己的 `node`；本次只改变 Lody 自有启动器，
用户工具仍使用其 PATH 中的 Node。

生成文件内嵌运行时路径。每次托管预准备都会重写这些文件，应用更新后路径变化会在下一个会话生效。

## Broker 上下文归属

证据：同一本地项目会话首轮刷新正常，失败轮次记录
`execution.refresh_gh_token status=error durationMs=0`。使用已安装 bundle 自带的预准备、成员
判断、刷新和策略更新方法，没有 policy 的本地会话在无 broker 上下文时成功，在其会话 ID 存在上下文时
失败。源码中，成员关系是刷新的唯一门槛；预准备在最后一次中止检查前注册上下文，清理时也从不撤销。
取消预准备或认领未命中都不等待进行中的凭据设置，因此被放弃的托管预准备可能在冷启动本地会话首轮
刷新之后才注册上下文。该顺序与日志相符，但属于推断；触发它的用户交互尚未确认。

`GitCredentialBroker.acquireSessionContext` 返回幂等租约，并按会话 ID 计数持有者；最后一次释放
撤销当前 token 及其上下文文件，包括所有者变更后轮换出的 token。预准备在其他设置完成后才获取租约，
在中止、失败或未被接管的清理时释放，被接管时把租约交给持久会话。持久会话仍保留上下文直到 broker
关闭；关闭会推进代数，旧租约不能释放新上下文。刷新在查询成员关系前先对本地项目返回。有上下文但
没有 policy 的托管会话仍然失败关闭，所有者变更仍会终止旧进程。

备选方案：删除或吞掉缺少 policy 的检查，或给本地会话补 policy，会掩盖真实的托管设置错误或把本地
会话纳入托管。每次预准备清理都撤销也不安全：同一所有者复用同一 token，迟到的清理会撤销替代会话的
上下文。只以会话自身 policy 决定是否刷新，会去掉托管会话的失败关闭检查。

剩余限制：会话终止时仍不释放持久上下文。解析出不同所有者的过期预准备仍会像以前一样轮换 token。

## 验证

已编写但未在此执行，因为作者环境禁止运行 Node 测试：`host-node-launcher.test.ts`（空 PATH、
带空格的运行时路径、两种运行时模式、真实 `git credential fill`），`github-git-transport.test.ts`
与 `gh-shim-script.test.ts` 的新用例，`git-credential-broker.test.ts` 的租约用例，以及预准备
生命周期套件 `session-manager-github-context.test.ts`。未在打包后的 macOS 或 Windows 上运行。
相关决策：[本地原生认证](../feature/2026-09-29-local-project-native-github-auth.zh.md)与
[按命令选择凭据](../architecture/2026-09-26-github-command-credentials.zh.md)。
Issue：[#1307](https://github.com/LodyAI/Lody/issues/1307)。
