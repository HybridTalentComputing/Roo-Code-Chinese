import * as vscode from "vscode"
import { TOOL_GROUPS, ToolGroup, ALWAYS_AVAILABLE_TOOLS } from "./tool-groups"
import { addCustomInstructions } from "../core/prompts/sections/custom-instructions"

// 模式类型
export type Mode = string

// 分组选项类型
export type GroupOptions = {
	fileRegex?: string // 正则表达式模式
	description?: string // 模式的人类可读描述
}

// 分组条目可以是字符串或带选项的元组
export type GroupEntry = ToolGroup | readonly [ToolGroup, GroupOptions]

// 模式配置类型
export type ModeConfig = {
	slug: string
	name: string
	roleDefinition: string
	customInstructions?: string
	groups: readonly GroupEntry[] // 现在支持简单字符串和带选项的元组
	source?: "global" | "project" // 此模式的加载来源
}

// 仅模式特定的提示
export type PromptComponent = {
	roleDefinition?: string
	customInstructions?: string
}

export type CustomModePrompts = {
	[key: string]: PromptComponent | undefined
}

// 帮助函数：提取分组名称，无论格式如何
export function getGroupName(group: GroupEntry): ToolGroup {
	if (typeof group === "string") {
		return group
	}

	return group[0]
}

// 帮助函数：获取分组选项（如果存在）
function getGroupOptions(group: GroupEntry): GroupOptions | undefined {
	return Array.isArray(group) ? group[1] : undefined
}

// 帮助函数：检查文件路径是否匹配正则表达式模式
export function doesFileMatchRegex(filePath: string, pattern: string): boolean {
	try {
		const regex = new RegExp(pattern)
		return regex.test(filePath)
	} catch (error) {
		console.error(`无效的正则表达式模式: ${pattern}`, error)
		return false
	}
}

// 帮助函数：获取模式的所有工具
export function getToolsForMode(groups: readonly GroupEntry[]): string[] {
	const tools = new Set<string>()

	// 从每个分组添加工具
	groups.forEach((group) => {
		const groupName = getGroupName(group)
		const groupConfig = TOOL_GROUPS[groupName]
		groupConfig.tools.forEach((tool: string) => tools.add(tool))
	})

	// 始终添加必需的工具
	ALWAYS_AVAILABLE_TOOLS.forEach((tool) => tools.add(tool))

	return Array.from(tools)
}

// 主要模式配置，作为有序数组
export const modes: readonly ModeConfig[] = [
	{
		slug: "code",
		name: "代码",
		roleDefinition:
			"你是 Roo，一位技术精湛的软件工程师，在多种编程语言、框架、设计模式和最佳实践方面拥有丰富的知识。",
		groups: ["read", "edit", "browser", "command", "mcp"],
	},
	{
		slug: "architect",
		name: "架构师",
		roleDefinition:
			"你是 Roo，一位经验丰富的技术领导者，善于探究和出色的规划者。你的目标是收集信息并了解上下文，以创建详细的任务执行计划，用户将在切换到其他模式实施解决方案之前审查并批准该计划。",
		groups: ["read", ["edit", { fileRegex: "\\.md$", description: "仅限 Markdown 文件" }], "browser", "mcp"],
		customInstructions:
			"1. 进行一些信息收集（例如使用 read_file 或 search_files）以获取有关任务的更多上下文。\n\n2. 你还应该向用户提出澄清性问题，以更好地理解任务。\n\n3. 一旦你获得了更多关于用户请求的上下文，你应该创建一个关于如何完成任务的详细计划。如果有助于使你的计划更清晰，可以包含 Mermaid 图表。\n\n4. 询问用户是否对这个计划满意，或者是否想做任何更改。将此视为一个头脑风暴会议，你可以在其中讨论任务并计划最佳的完成方式。\n\n5. 一旦用户确认计划，询问他们是否希望你将其写入 markdown 文件。\n\n6. 使用 switch_mode 工具请求用户切换到另一个模式来实施解决方案。",
	},
	{
		slug: "ask",
		name: "咨询",
		roleDefinition: "你是 Roo，一位知识渊博的技术助手，专注于回答问题并提供有关软件开发、技术和相关主题的信息。",
		groups: ["read", "browser", "mcp"],
		customInstructions:
			"你可以分析代码、解释概念并访问外部资源。确保回答用户的问题，不要急于切换到实现代码。如果有助于使你的回答更清晰，可以包含 Mermaid 图表。",
	},
	{
		slug: "debug",
		name: "调试",
		roleDefinition: "你是 Roo，一位专门从事系统问题诊断和解决的专家调试员。",
		groups: ["read", "edit", "browser", "command", "mcp"],
		customInstructions:
			"思考问题的5-7个不同可能来源，将其提炼为1-2个最可能的来源，然后添加日志以验证你的假设。在修复问题之前，明确要求用户确认诊断结果。",
	},
] as const

// 导出默认模式标识
export const defaultModeSlug = modes[0].slug

// 辅助函数
export function getModeBySlug(slug: string, customModes?: ModeConfig[]): ModeConfig | undefined {
	// 首先检查自定义模式
	const customMode = customModes?.find((mode) => mode.slug === slug)
	if (customMode) {
		return customMode
	}
	// 然后检查内置模式
	return modes.find((mode) => mode.slug === slug)
}

export function getModeConfig(slug: string, customModes?: ModeConfig[]): ModeConfig {
	const mode = getModeBySlug(slug, customModes)
	if (!mode) {
		throw new Error(`未找到标识为 ${slug} 的模式`)
	}
	return mode
}

// 获取所有可用模式，自定义模式会覆盖内置模式
export function getAllModes(customModes?: ModeConfig[]): ModeConfig[] {
	if (!customModes?.length) {
		return [...modes]
	}

	// 从内置模式开始
	const allModes = [...modes]

	// 处理自定义模式
	customModes.forEach((customMode) => {
		const index = allModes.findIndex((mode) => mode.slug === customMode.slug)
		if (index !== -1) {
			// 覆盖现有模式
			allModes[index] = customMode
		} else {
			// 添加新模式
			allModes.push(customMode)
		}
	})

	return allModes
}

// 检查模式是否为自定义或覆盖
export function isCustomMode(slug: string, customModes?: ModeConfig[]): boolean {
	return !!customModes?.some((mode) => mode.slug === slug)
}

// 文件限制的自定义错误类
export class FileRestrictionError extends Error {
	constructor(mode: string, pattern: string, description: string | undefined, filePath: string) {
		super(
			`此模式 (${mode}) 只能编辑匹配模式的文件: ${pattern}${description ? ` (${description})` : ""}。得到: ${filePath}`,
		)
		this.name = "FileRestrictionError"
	}
}

export function isToolAllowedForMode(
	tool: string,
	modeSlug: string,
	customModes: ModeConfig[],
	toolRequirements?: Record<string, boolean>,
	toolParams?: Record<string, any>, // All tool parameters
	experiments?: Record<string, boolean>,
): boolean {
	// 始终允许这些工具
	if (ALWAYS_AVAILABLE_TOOLS.includes(tool as any)) {
		return true
	}

	if (experiments && tool in experiments) {
		if (!experiments[tool]) {
			return false
		}
	}

	// 检查工具要求（如果存在）
	if (toolRequirements && tool in toolRequirements) {
		if (!toolRequirements[tool]) {
			return false
		}
	}

	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		return false
	}

	// 检查工具是否在模式的任何分组中并遵守任何分组选项
	for (const group of mode.groups) {
		const groupName = getGroupName(group)
		const options = getGroupOptions(group)

		const groupConfig = TOOL_GROUPS[groupName]

		// 如果工具不在此分组的工具中，继续下一个分组
		if (!groupConfig.tools.includes(tool)) {
			continue
		}

		// 如果没有选项，允许使用工具
		if (!options) {
			return true
		}

		// 对于编辑分组，如果指定了文件正则表达式，则进行检查
		if (groupName === "edit" && options.fileRegex) {
			const filePath = toolParams?.path
			if (
				filePath &&
				(toolParams.diff || toolParams.content || toolParams.operations) &&
				!doesFileMatchRegex(filePath, options.fileRegex)
			) {
				throw new FileRestrictionError(mode.name, options.fileRegex, options.description, filePath)
			}
		}

		return true
	}

	return false
}

// 创建模式特定的默认提示
export const defaultPrompts: Readonly<CustomModePrompts> = Object.freeze(
	Object.fromEntries(
		modes.map((mode) => [
			mode.slug,
			{
				roleDefinition: mode.roleDefinition,
				customInstructions: mode.customInstructions,
			},
		]),
	),
)

// 帮助函数：从扩展状态获取所有带提示覆盖的模式
export async function getAllModesWithPrompts(context: vscode.ExtensionContext): Promise<ModeConfig[]> {
	const customModes = (await context.globalState.get<ModeConfig[]>("customModes")) || []
	const customModePrompts = (await context.globalState.get<CustomModePrompts>("customModePrompts")) || {}

	const allModes = getAllModes(customModes)
	return allModes.map((mode) => ({
		...mode,
		roleDefinition: customModePrompts[mode.slug]?.roleDefinition ?? mode.roleDefinition,
		customInstructions: customModePrompts[mode.slug]?.customInstructions ?? mode.customInstructions,
	}))
}

// 帮助函数：获取带所有覆盖的完整模式详情
export async function getFullModeDetails(
	modeSlug: string,
	customModes?: ModeConfig[],
	customModePrompts?: CustomModePrompts,
	options?: {
		cwd?: string
		globalCustomInstructions?: string
		preferredLanguage?: string
	},
): Promise<ModeConfig> {
	// First get the base mode config from custom modes or built-in modes
	const baseMode = getModeBySlug(modeSlug, customModes) || modes.find((m) => m.slug === modeSlug) || modes[0]

	// Check for any prompt component overrides
	const promptComponent = customModePrompts?.[modeSlug]

	// Get the base custom instructions
	const baseCustomInstructions = promptComponent?.customInstructions || baseMode.customInstructions || ""

	// 如果我们有cwd，加载并组合所有自定义指令
	let fullCustomInstructions = baseCustomInstructions
	if (options?.cwd) {
		fullCustomInstructions = await addCustomInstructions(
			baseCustomInstructions,
			options.globalCustomInstructions || "",
			options.cwd,
			modeSlug,
			{ preferredLanguage: options.preferredLanguage },
		)
	}

	// 返回应用了所有覆盖的模式
	return {
		...baseMode,
		roleDefinition: promptComponent?.roleDefinition || baseMode.roleDefinition,
		customInstructions: fullCustomInstructions,
	}
}

// 帮助函数：安全地获取角色定义
export function getRoleDefinition(modeSlug: string, customModes?: ModeConfig[]): string {
	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		console.warn(`未找到标识为 ${modeSlug} 的模式`)
		return ""
	}
	return mode.roleDefinition
}

// 帮助函数：安全地获取自定义指令
export function getCustomInstructions(modeSlug: string, customModes?: ModeConfig[]): string {
	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		console.warn(`未找到标识为 ${modeSlug} 的模式`)
		return ""
	}
	return mode.customInstructions ?? ""
}
