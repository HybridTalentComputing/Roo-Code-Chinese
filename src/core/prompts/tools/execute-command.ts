import { ToolArgs } from "./types"

export function getExecuteCommandDescription(args: ToolArgs): string | undefined {
	return `## execute_command
Description: 请求在系统上执行CLI命令。当您需要执行系统操作或运行特定命令来完成用户任务中的任何步骤时，请使用此工具。您必须根据用户的系统定制命令，并清楚地解释命令的功能。对于命令链接，请使用适合用户shell的链接语法。相比创建可执行脚本，更推荐执行复杂的CLI命令，因为它们更灵活且更容易运行。命令将在当前工作目录执行：${args.cwd}
Parameters:
- command: (必需) 要执行的CLI命令。这应该是适用于当前操作系统的有效命令。确保命令格式正确且不包含任何有害指令。
Usage:
<execute_command>
<command>在此处输入您的命令</command>
</execute_command>

Example: 请求执行 npm run dev
<execute_command>
<command>npm run dev</command>
</execute_command>`
}
