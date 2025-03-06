export const EXPERIMENT_IDS = {
	DIFF_STRATEGY: "experimentalDiffStrategy",
	SEARCH_AND_REPLACE: "search_and_replace",
	INSERT_BLOCK: "insert_content",
	POWER_STEERING: "powerSteering",
} as const

export type ExperimentKey = keyof typeof EXPERIMENT_IDS
export type ExperimentId = valueof<typeof EXPERIMENT_IDS>

export interface ExperimentConfig {
	name: string
	description: string
	enabled: boolean
}

type valueof<X> = X[keyof X]

export const experimentConfigsMap: Record<ExperimentKey, ExperimentConfig> = {
	DIFF_STRATEGY: {
		name: "使用实验性统一差异对比策略",
		description:
			"启用实验性统一差异对比策略。此策略可能会减少由模型错误导致的重试次数，但可能会导致意外行为或不正确的编辑。仅在您了解风险并愿意仔细审查所有更改时才启用。",
		enabled: false,
	},
	SEARCH_AND_REPLACE: {
		name: "使用实验性搜索和替换工具",
		description: "启用实验性搜索和替换工具，允许 Roo 在一个请求中替换搜索词的多个实例。",
		enabled: false,
	},
	INSERT_BLOCK: {
		name: "使用实验性内容插入工具",
		description: "启用实验性内容插入工具，允许 Roo 在不需要创建差异对比的情况下在特定行号插入内容。",
		enabled: false,
	},
	POWER_STEERING: {
		name: '使用实验性"动力转向"模式',
		description:
			"启用后，Roo 将更频繁地提醒模型关于其当前模式定义的详细信息。这将导致对角色定义和自定义指令的更强遵守，但每条消息将使用更多令牌。",
		enabled: false,
	},
}

export const experimentDefault = Object.fromEntries(
	Object.entries(experimentConfigsMap).map(([_, config]) => [
		EXPERIMENT_IDS[_ as keyof typeof EXPERIMENT_IDS] as ExperimentId,
		config.enabled,
	]),
) as Record<ExperimentId, boolean>

export const experiments = {
	get: (id: ExperimentKey): ExperimentConfig | undefined => {
		return experimentConfigsMap[id]
	},
	isEnabled: (experimentsConfig: Record<ExperimentId, boolean>, id: ExperimentId): boolean => {
		return experimentsConfig[id] ?? experimentDefault[id]
	},
} as const

// 为 UI 暴露实验详情 - 预先从映射计算以提高性能
export const experimentLabels = Object.fromEntries(
	Object.entries(experimentConfigsMap).map(([_, config]) => [
		EXPERIMENT_IDS[_ as keyof typeof EXPERIMENT_IDS] as ExperimentId,
		config.name,
	]),
) as Record<string, string>

export const experimentDescriptions = Object.fromEntries(
	Object.entries(experimentConfigsMap).map(([_, config]) => [
		EXPERIMENT_IDS[_ as keyof typeof EXPERIMENT_IDS] as ExperimentId,
		config.description,
	]),
) as Record<string, string>
