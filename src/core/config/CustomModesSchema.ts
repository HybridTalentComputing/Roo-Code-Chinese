import { z } from "zod"
import { ModeConfig } from "../../shared/modes"
import { TOOL_GROUPS, ToolGroup } from "../../shared/tool-groups"

// 使用 TOOL_GROUPS 的键创建有效工具组的模式
const ToolGroupSchema = z.enum(Object.keys(TOOL_GROUPS) as [ToolGroup, ...ToolGroup[]])

// 带有正则表达式验证的分组选项模式
const GroupOptionsSchema = z.object({
	fileRegex: z
		.string()
		.optional()
		.refine(
			(pattern) => {
				if (!pattern) return true // 可选的，所以空值有效
				try {
					new RegExp(pattern)
					return true
				} catch {
					return false
				}
			},
			{ message: "无效的正则表达式模式" },
		),
	description: z.string().optional(),
})

// 分组条目的模式 - 可以是工具组字符串或 [组, 选项] 的元组
const GroupEntrySchema = z.union([ToolGroupSchema, z.tuple([ToolGroupSchema, GroupOptionsSchema])])

// 分组数组的模式
const GroupsArraySchema = z.array(GroupEntrySchema).refine(
	(groups) => {
		const seen = new Set()
		return groups.every((group) => {
			// 对于元组，检查组名（第一个元素）
			const groupName = Array.isArray(group) ? group[0] : group
			if (seen.has(groupName)) return false
			seen.add(groupName)
			return true
		})
	},
	{ message: "不允许重复的分组" },
)

// 模式配置的模式
export const CustomModeSchema = z.object({
	slug: z.string().regex(/^[a-zA-Z0-9-]+$/, "标识符只能包含字母、数字和连字符"),
	name: z.string().min(1, "名称是必需的"),
	roleDefinition: z.string().min(1, "角色定义是必需的"),
	customInstructions: z.string().optional(),
	groups: GroupsArraySchema,
}) satisfies z.ZodType<ModeConfig>

// 整个自定义模式设置文件的模式
export const CustomModesSettingsSchema = z.object({
	customModes: z.array(CustomModeSchema).refine(
		(modes) => {
			const slugs = new Set()
			return modes.every((mode) => {
				if (slugs.has(mode.slug)) {
					return false
				}
				slugs.add(mode.slug)
				return true
			})
		},
		{
			message: "不允许重复的模式标识符",
		},
	),
})

export type CustomModesSettings = z.infer<typeof CustomModesSettingsSchema>

/**
 * 根据模式验证自定义模式配置
 * @throws {z.ZodError} 如果验证失败
 */
export function validateCustomMode(mode: unknown): asserts mode is ModeConfig {
	CustomModeSchema.parse(mode)
}
