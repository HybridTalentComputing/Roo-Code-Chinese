// 定义工具组配置
export type ToolGroupConfig = {
	tools: readonly string[]
	alwaysAvailable?: boolean // 该组是否始终可用且不应在提示视图中显示
}

// 工具标识符到显示名称的映射
export const TOOL_DISPLAY_NAMES = {
	execute_command: "运行命令",
	read_file: "读取文件",
	write_to_file: "写入文件",
	apply_diff: "应用更改",
	search_files: "搜索文件",
	list_files: "列出文件",
	list_code_definition_names: "列出定义",
	browser_action: "使用浏览器",
	use_mcp_tool: "使用MCP工具",
	access_mcp_resource: "访问MCP资源",
	ask_followup_question: "提问问题",
	attempt_completion: "完成任务",
	switch_mode: "切换模式",
	new_task: "创建新任务",
} as const

// 定义可用的工具组
export const TOOL_GROUPS: Record<string, ToolGroupConfig> = {
	read: {
		tools: ["read_file", "search_files", "list_files", "list_code_definition_names"],
	},
	edit: {
		tools: ["apply_diff", "write_to_file", "insert_content", "search_and_replace"],
	},
	browser: {
		tools: ["browser_action"],
	},
	command: {
		tools: ["execute_command"],
	},
	mcp: {
		tools: ["use_mcp_tool", "access_mcp_resource"],
	},
	modes: {
		tools: ["switch_mode", "new_task"],
		alwaysAvailable: true,
	},
}

export type ToolGroup = keyof typeof TOOL_GROUPS

// 在所有模式下始终可用的工具
export const ALWAYS_AVAILABLE_TOOLS = [
	"ask_followup_question",
	"attempt_completion",
	"switch_mode",
	"new_task",
] as const

// 工具名称类型，用于类型安全
export type ToolName = keyof typeof TOOL_DISPLAY_NAMES

// 工具辅助函数
export function getToolName(toolConfig: string | readonly [ToolName, ...any[]]): ToolName {
	return typeof toolConfig === "string" ? (toolConfig as ToolName) : toolConfig[0]
}

export function getToolOptions(toolConfig: string | readonly [ToolName, ...any[]]): any {
	return typeof toolConfig === "string" ? undefined : toolConfig[1]
}

// 工具组在UI中的显示名称
export const GROUP_DISPLAY_NAMES: Record<ToolGroup, string> = {
	read: "读取文件",
	edit: "编辑文件",
	browser: "使用浏览器",
	command: "运行命令",
	mcp: "使用MCP",
}
