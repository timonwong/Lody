# GitHub 凭据适配器运行时与上下文归属

Status: implemented
Translation: current

[English](2026-10-08-github-credential-runtime-context.md)

## 摘要

Lody 生成的 Git 与 gh 适配器通过 PATH 中的 `node` 启动，桌面主机没有 Node 时托管 checkout
会在 Agent 启动前失败。另一方面，被放弃的预准备可能在会话 ID 下留下 broker 上下文，轮次开始的
刷新把它当作托管注册，使之后的本地项目轮次以 `github_context_missing` 失败。适配器现改由 CLI
自身运行时重新执行；broker 上下文改为租约，未被接管的预准备会释放，刷新也像预准备一样跳过本地
项目。测试已编写但作者 Agent 未运行；留下残留上下文的桌面交互属于推断，未复现。

## 适配器运行时

已在 macOS 确认：PATH 只含系统目录时，生成的 Git 包装脚本以 127 退出
（`env: node: No such file or directory`）；显式 Node 运行同一文件则输出 Git 版本。桌面应用以
`ELECTRON_RUN_AS_NODE=1` 在 Electron helper 中运行 CLI。

`lib/host-node-launcher.ts` 为 Git 包装脚本、HTTP 适配器和 gh shim 生成两行 sh/CommonJS 前导：
sh 以带引号的运行时路径重新执行文件（并设置 Electron 的 Node 模式），Node 把第二行读作指令加
注释。文件名、`__filename`、`.cmd` 入口和基于 vm 的测试不变。凭据 helper 命令与诊断 helper
探测使用同一运行时。

未采用：绝对路径 shebang 无法容纳 `Lody Helper.app` 路径中的空格，也不能设置 Electron 模式；
独立 sh 启动器加 `.cjs` 主体会增加文件并破坏 gh shim 基于 `__filename` 的自我排除；把 Lody
运行时加入 PATH 会替换用户自己的 `node`。生成文件内嵌运行时路径，每次托管预准备都会重写，
应用位置变化在下一个会话生效。

## Broker 上下文归属

已确认：同一本地会话首轮刷新成功后，失败轮次记录 `execution.refresh_gh_token status=error
durationMs=0`。用已安装 bundle 自带的预准备、成员判断、刷新与策略方法，无 policy 的本地会话
仅在其 ID 存在上下文时失败。源码中成员关系是刷新的唯一门槛，预准备在最后一次中止检查前注册
上下文，清理从不撤销。推断：取消与认领未命中不等待进行中的凭据设置，被放弃的托管预准备可能在
冷启动本地会话首轮刷新之后才注册。

`GitCredentialBroker.acquireSessionContext` 返回按会话 ID 计数的幂等租约；最后一次释放撤销当前
token 与文件，所有者轮换后亦然。预准备最后才获取，中止、失败或未被接管的清理时释放，接管时
移交租约。持久会话仍保留上下文至关闭，关闭推进代数，旧租约不能释放新上下文。刷新在检查成员
关系前对本地项目返回；无 policy 的托管会话仍失败关闭，所有者变更仍终止旧进程。

未采用：删除缺 policy 检查或给本地会话补 policy 会掩盖托管设置错误或纳入本地会话；每次清理都
撤销会让迟到的清理撤销替代会话共享的 token；只看会话自身 policy 会去掉托管失败关闭检查。

限制：会话终止时仍不释放持久上下文；解析出不同所有者的过期预准备仍会轮换 token。

## 验证

回归套件覆盖空 PATH、带空格的运行时路径、两种运行时模式、真实 `git credential fill`、broker
租约与预准备生命周期。作者环境未执行这些测试，也未在打包后的 macOS 或 Windows 上运行。
相关：[本地原生认证](../feature/2026-09-29-local-project-native-github-auth.zh.md)、
[按命令选择凭据](../architecture/2026-09-26-github-command-credentials.zh.md)、
Issue [#1307](https://github.com/LodyAI/Lody/issues/1307)。
