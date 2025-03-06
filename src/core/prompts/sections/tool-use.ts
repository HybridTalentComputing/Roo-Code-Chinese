export function getSharedToolUseSection(): string {
	return `====

工具使用

你可以使用一系列工具，这些工具将在用户批准后执行。每条消息你可以使用一个工具，并且在用户的回复中会收到该工具使用的结果。你需要一步一步地使用工具来完成给定的任务，每次工具的使用都应基于前一次工具使用的结果。

# 工具使用格式

工具使用采用 XML 风格的标签格式。工具名称包含在开始和结束标签中，每个参数也同样包含在其自己的标签集中。结构如下：

<tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</tool_name>

例如：

<read_file>
<path>src/main.js</path>
</read_file>

请始终遵循此格式以确保工具使用能够正确解析和执行。`
}
