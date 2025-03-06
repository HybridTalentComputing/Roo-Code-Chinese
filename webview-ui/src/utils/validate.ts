import { ApiConfiguration, ModelInfo } from "../../../src/shared/api"

export function validateApiConfiguration(apiConfiguration?: ApiConfiguration): string | undefined {
	if (!apiConfiguration) {
		return undefined
	}

	switch (apiConfiguration.apiProvider) {
		case "openrouter":
			if (!apiConfiguration.openRouterApiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "glama":
			if (!apiConfiguration.glamaApiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "unbound":
			if (!apiConfiguration.unboundApiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "requesty":
			if (!apiConfiguration.requestyApiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "anthropic":
			if (!apiConfiguration.apiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "bedrock":
			if (!apiConfiguration.awsRegion) {
				return "请选择AWS Bedrock要使用的区域。"
			}
			break
		case "vertex":
			if (!apiConfiguration.vertexProjectId || !apiConfiguration.vertexRegion) {
				return "请提供有效的Google Cloud项目ID和区域。"
			}
			break
		case "gemini":
			if (!apiConfiguration.geminiApiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "openai-native":
			if (!apiConfiguration.openAiNativeApiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "mistral":
			if (!apiConfiguration.mistralApiKey) {
				return "请提供有效的API密钥。"
			}
			break
		case "openai":
			if (!apiConfiguration.openAiBaseUrl || !apiConfiguration.openAiApiKey || !apiConfiguration.openAiModelId) {
				return "请提供有效的基础URL、API密钥和模型ID。"
			}
			break
		case "ollama":
			if (!apiConfiguration.ollamaModelId) {
				return "请提供有效的模型ID。"
			}
			break
		case "lmstudio":
			if (!apiConfiguration.lmStudioModelId) {
				return "请提供有效的模型ID。"
			}
			break
		case "vscode-lm":
			if (!apiConfiguration.vsCodeLmModelSelector) {
				return "请提供有效的模型选择器。"
			}
			break
	}

	return undefined
}

export function validateModelId(
	apiConfiguration?: ApiConfiguration,
	glamaModels?: Record<string, ModelInfo>,
	openRouterModels?: Record<string, ModelInfo>,
	unboundModels?: Record<string, ModelInfo>,
	requestyModels?: Record<string, ModelInfo>,
): string | undefined {
	if (!apiConfiguration) {
		return undefined
	}

	switch (apiConfiguration.apiProvider) {
		case "openrouter":
			const modelId = apiConfiguration.openRouterModelId

			if (!modelId) {
				return "请提供模型ID。"
			}

			if (
				openRouterModels &&
				Object.keys(openRouterModels).length > 1 &&
				!Object.keys(openRouterModels).includes(modelId)
			) {
				return `您提供的模型ID (${modelId}) 不可用。请选择其他模型。`
			}

			break

		case "glama":
			const glamaModelId = apiConfiguration.glamaModelId

			if (!glamaModelId) {
				return "请提供模型ID。"
			}

			if (
				glamaModels &&
				Object.keys(glamaModels).length > 1 &&
				!Object.keys(glamaModels).includes(glamaModelId)
			) {
				return `您提供的模型ID (${glamaModelId}) 不可用。请选择其他模型。`
			}

			break

		case "unbound":
			const unboundModelId = apiConfiguration.unboundModelId

			if (!unboundModelId) {
				return "请提供模型ID。"
			}

			if (
				unboundModels &&
				Object.keys(unboundModels).length > 1 &&
				!Object.keys(unboundModels).includes(unboundModelId)
			) {
				return `您提供的模型ID (${unboundModelId}) 不可用。请选择其他模型。`
			}

			break

		case "requesty":
			const requestyModelId = apiConfiguration.requestyModelId

			if (!requestyModelId) {
				return "请提供模型ID。"
			}

			if (
				requestyModels &&
				Object.keys(requestyModels).length > 1 &&
				!Object.keys(requestyModels).includes(requestyModelId)
			) {
				return `您提供的模型ID (${requestyModelId}) 不可用。请选择其他模型。`
			}

			break
	}

	return undefined
}
