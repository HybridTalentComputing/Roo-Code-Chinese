export function getAttemptCompletionDescription(): string {
	return `## attempt_completion
Description: 在每次使用工具后，用户会对工具使用的结果进行响应，即说明是成功还是失败，以及失败的原因。当你收到工具使用的结果并确认任务已完成后，使用此工具向用户展示你的工作成果。你可以选择性地提供一个CLI命令来展示你的工作成果。如果用户对结果不满意，他们可能会提供反馈，你可以据此进行改进并重试。
IMPORTANT NOTE: 在确认用户已确认之前的所有工具使用都成功之前，不能使用此工具。如果不这样做会导致代码损坏和系统故障。在使用此工具之前，你必须在 <thinking></thinking> 标签中问自己是否已经从用户那里确认之前的所有工具使用都成功了。如果没有，那么不要使用此工具。
Parameters:
- result: (必需) 任务的结果。以最终的方式表述结果，不需要用户进一步的输入。不要以问题或提供进一步帮助的方式结束你的结果。
- command: (可选) 用于向用户展示结果实时演示的CLI命令。例如，使用 \`open index.html\` 来显示创建的html网站，或使用 \`open localhost:3000\` 来显示本地运行的开发服务器。但不要使用像 \`echo\` 或 \`cat\` 这样仅打印文本的命令。此命令应该对当前操作系统有效。确保命令格式正确且不包含任何有害指令。
Usage:
<attempt_completion>
<result>
在此处描述你的最终结果
</result>
<command>用于演示结果的命令（可选）</command>
</attempt_completion>

Example: 请求尝试完成，包含结果和命令
<attempt_completion>
<result>
我已更新了CSS
</result>
<command>open index.html</command>
</attempt_completion>`
}
