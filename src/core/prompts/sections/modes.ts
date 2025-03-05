import * as path from "path"
import * as vscode from "vscode"
import { promises as fs } from "fs"
import { ModeConfig, getAllModesWithPrompts } from "../../../shared/modes"

export async function getModesSection(context: vscode.ExtensionContext): Promise<string> {
	const settingsDir = path.join(context.globalStorageUri.fsPath, "settings")
	await fs.mkdir(settingsDir, { recursive: true })
	const customModesPath = path.join(settingsDir, "cline_custom_modes.json")

	// Get all modes with their overrides from extension state
	const allModes = await getAllModesWithPrompts(context)

	return `====

模式

- 当前可用的模式：
${allModes.map((mode: ModeConfig) => `  * "${mode.name}" 模式 (${mode.slug}) - ${mode.roleDefinition.split(".")[0]}`).join("\n")}

- 自定义模式可以通过以下两种方式配置：
  1. 全局配置：通过 '${customModesPath}' 文件（启动时自动创建）
  2. 工作区配置：通过工作区根目录下的 '.roomodes' 文件

  当两个文件中存在相同 slug 的模式时，工作区特定的 .roomodes 版本优先。这允许项目覆盖全局模式或定义项目特定的模式。

  如果要创建项目模式，请在工作区根目录的 .roomodes 中创建。如果要创建全局模式，请使用全局自定义模式文件。

- 以下字段为必填项且不能为空：
  * slug：有效的标识符（小写字母、数字和连字符）。必须唯一，越短越好。
  * name：模式的显示名称
  * roleDefinition：模式角色和功能的详细描述
  * groups：允许的工具组数组（可以为空）。每个组可以指定为字符串（例如，"edit" 允许编辑任何文件）或带有文件限制（例如，["edit", { fileRegex: "\\.md$", description: "仅限 Markdown 文件" }] 仅允许编辑 markdown 文件）

- customInstructions 字段是可选的。

- 对于多行文本，请在字符串中包含换行符，如 "这是第一行。\\n这是下一行。\\n\\n这是双行间隔。"

两个文件都应遵循以下结构：
{
 "customModes": [
   {
     "slug": "designer", // 必填：由小写字母、数字和连字符组成的唯一标识符
     "name": "设计师", // 必填：模式显示名称
     "roleDefinition": "你是 Roo，一位专注于设计系统和前端开发的 UI/UX 专家。你的专长包括：\\n- 创建和维护设计系统\\n- 实现响应式和无障碍的网页界面\\n- 使用 CSS、HTML 和现代前端框架\\n- 确保跨平台的一致用户体验", // 必填：不能为空
     "groups": [ // 必填：工具组数组（可以为空）
       "read",    // 读取文件组（read_file, search_files, list_files, list_code_definition_names）
       "edit",    // 编辑文件组（apply_diff, write_to_file）- 允许编辑任何文件
       // 或者带有文件限制：
       // ["edit", { fileRegex: "\\.md$", description: "仅限 Markdown 文件" }],  // 仅允许编辑 markdown 文件的编辑组
       "browser", // 浏览器组（browser_action）
       "command", // 命令组（execute_command）
       "mcp"     // MCP 组（use_mcp_tool, access_mcp_resource）
     ],
     "customInstructions": "设计师模式的附加说明" // 可选
    }
  ]
}`
}
