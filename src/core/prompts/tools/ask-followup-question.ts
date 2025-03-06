export function getAskFollowupQuestionDescription(): string {
	return `## ask_followup_question
Description: 向用户提出问题以收集完成任务所需的额外信息。当您遇到模糊之处、需要澄清或需要更多细节以有效推进时，应使用此工具。它通过实现与用户的直接沟通来支持交互式问题解决。请谨慎使用此工具，在收集必要信息和避免过多来回交互之间保持平衡。
Parameters:
- question: (必填) 要向用户提出的问题。这应该是一个明确、具体的问题，针对您需要的信息。
Usage:
<ask_followup_question>
<question>在此处输入您的问题</question>
</ask_followup_question>

Example: 请求用户提供frontend-config.json文件的路径
<ask_followup_question>
<question>frontend-config.json文件的路径是什么？</question>
</ask_followup_question>`
}
