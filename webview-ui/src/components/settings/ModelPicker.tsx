import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem } from "@/components/ui/combobox"

import { ApiConfiguration, ModelInfo } from "../../../../src/shared/api"

import { normalizeApiConfiguration } from "./ApiOptions"
import { ThinkingBudget } from "./ThinkingBudget"
import { ModelInfoView } from "./ModelInfoView"

type ExtractType<T> = NonNullable<
	{ [K in keyof ApiConfiguration]: Required<ApiConfiguration>[K] extends T ? K : never }[keyof ApiConfiguration]
>

type ModelIdKeys = NonNullable<
	{ [K in keyof ApiConfiguration]: K extends `${string}ModelId` ? K : never }[keyof ApiConfiguration]
>

interface ModelPickerProps {
	defaultModelId: string
	defaultModelInfo?: ModelInfo
	models: Record<string, ModelInfo> | null
	modelIdKey: ModelIdKeys
	modelInfoKey: ExtractType<ModelInfo>
	serviceName: string
	serviceUrl: string
	apiConfiguration: ApiConfiguration
	setApiConfigurationField: <K extends keyof ApiConfiguration>(field: K, value: ApiConfiguration[K]) => void
}

export const ModelPicker = ({
	defaultModelId,
	models,
	modelIdKey,
	modelInfoKey,
	serviceName,
	serviceUrl,
	apiConfiguration,
	setApiConfigurationField,
	defaultModelInfo,
}: ModelPickerProps) => {
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
	const isInitialized = useRef(false)

	const modelIds = useMemo(() => Object.keys(models ?? {}).sort((a, b) => a.localeCompare(b)), [models])

	const { selectedModelId, selectedModelInfo } = useMemo(
		() => normalizeApiConfiguration(apiConfiguration),
		[apiConfiguration],
	)

	const onSelect = useCallback(
		(modelId: string) => {
			const modelInfo = models?.[modelId]
			setApiConfigurationField(modelIdKey, modelId)
			setApiConfigurationField(modelInfoKey, modelInfo ?? defaultModelInfo)
		},
		[modelIdKey, modelInfoKey, models, setApiConfigurationField, defaultModelInfo],
	)

	const inputValue = apiConfiguration[modelIdKey]

	useEffect(() => {
		if (!inputValue && !isInitialized.current) {
			const initialValue = modelIds.includes(selectedModelId) ? selectedModelId : defaultModelId
			setApiConfigurationField(modelIdKey, initialValue)
		}

		isInitialized.current = true
	}, [inputValue, modelIds, setApiConfigurationField, modelIdKey, selectedModelId, defaultModelId])

	return (
		<>
			<div className="font-semibold">Model</div>
			<Combobox type="single" inputValue={inputValue} onInputValueChange={onSelect}>
				<ComboboxInput placeholder="搜索模型..." data-testid="model-input" />
				<ComboboxContent>
					<ComboboxEmpty>未找到模型。</ComboboxEmpty>
					{modelIds.map((model) => (
						<ComboboxItem key={model} value={model}>
							{model}
						</ComboboxItem>
					))}
				</ComboboxContent>
			</Combobox>
			<ThinkingBudget
				apiConfiguration={apiConfiguration}
				setApiConfigurationField={setApiConfigurationField}
				modelInfo={selectedModelInfo}
			/>
			{selectedModelId && selectedModelInfo && selectedModelId === inputValue && (
				<ModelInfoView
					selectedModelId={selectedModelId}
					modelInfo={selectedModelInfo}
					isDescriptionExpanded={isDescriptionExpanded}
					setIsDescriptionExpanded={setIsDescriptionExpanded}
				/>
			)}
			<p>
				扩展会自动获取{" "}
				<VSCodeLink style={{ display: "inline", fontSize: "inherit" }} href={serviceUrl}>
					{serviceName}
				</VSCodeLink>
				上可用的最新模型列表。如果您不确定选择哪个模型，Roo Code 使用{" "}
				<VSCodeLink onClick={() => onSelect(defaultModelId)}>{defaultModelId}</VSCodeLink>
				效果最佳。您也可以搜索"free"来查看当前可用的免费选项。
			</p>
		</>
	)
}
