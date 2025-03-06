import { ToolArgs } from "./types"

export function getUseMcpToolDescription(args: ToolArgs): string | undefined {
	if (!args.mcpHub) {
		return undefined
	}
	return `## use_mcp_tool
描述：请求使用由已连接的MCP服务器提供的工具。每个MCP服务器可以提供具有不同功能的多个工具。工具具有定义的输入模式，用于指定必需和可选参数。
参数：
- server_name：（必需）提供工具的MCP服务器名称
- tool_name：（必需）要执行的工具名称
- arguments：（必需）包含工具输入参数的JSON对象，遵循工具的输入模式
使用方法：
<use_mcp_tool>
<server_name>在此填写服务器名称</server_name>
<tool_name>在此填写工具名称</tool_name>
<arguments>
{
  "param1": "value1",
  "param2": "value2"
}
</arguments>
</use_mcp_tool>

示例：请求使用MCP工具

<use_mcp_tool>
<server_name>weather-server</server_name>
<tool_name>get_forecast</tool_name>
<arguments>
{
  "city": "San Francisco",
  "days": 5
}
</arguments>
</use_mcp_tool>`
}
