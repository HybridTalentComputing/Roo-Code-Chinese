import { ToolArgs } from "./types"

export function getNewTaskDescription(args: ToolArgs): string {
	return `## new_task
Description: 使用指定的启动模式和初始消息创建新任务。此工具指示系统在给定模式下创建新的 Cline 实例，并提供初始消息。

Parameters:
- mode: (必填) 启动新任务的模式标识符（例如："code"、"ask"、"architect"）。
- message: (必填) 此新任务的初始用户消息或指令。

Usage:
<new_task>
<mode>在此填写模式标识符</mode>
<message>在此填写初始指令</message>
</new_task>

Example:
<new_task>
<mode>code</mode>
<message>为应用程序实现新功能。</message>
</new_task>
`
}
