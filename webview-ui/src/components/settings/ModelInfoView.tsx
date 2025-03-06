import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { Fragment } from "react"

import { ModelInfo, geminiModels } from "../../../../src/shared/api"
import { ModelDescriptionMarkdown } from "./ModelDescriptionMarkdown"
import { formatPrice } from "../../utils/formatPrice"

export const ModelInfoView = ({
	selectedModelId,
	modelInfo,
	isDescriptionExpanded,
	setIsDescriptionExpanded,
}: {
	selectedModelId: string
	modelInfo: ModelInfo
	isDescriptionExpanded: boolean
	setIsDescriptionExpanded: (isExpanded: boolean) => void
}) => {
	const isGemini = Object.keys(geminiModels).includes(selectedModelId)

	const infoItems = [
		modelInfo.description && (
			<ModelDescriptionMarkdown
				key="description"
				markdown={modelInfo.description}
				isExpanded={isDescriptionExpanded}
				setIsExpanded={setIsDescriptionExpanded}
			/>
		),
		<ModelInfoSupportsItem
			isSupported={modelInfo.supportsImages ?? false}
			supportsLabel="支持图片"
			doesNotSupportLabel="不支持图片"
		/>,
		<ModelInfoSupportsItem
			isSupported={modelInfo.supportsComputerUse ?? false}
			supportsLabel="支持计算机使用"
			doesNotSupportLabel="不支持计算机使用"
		/>,
		!isGemini && (
			<ModelInfoSupportsItem
				isSupported={modelInfo.supportsPromptCache}
				supportsLabel="支持提示缓存"
				doesNotSupportLabel="不支持提示缓存"
			/>
		),
		modelInfo.maxTokens !== undefined && modelInfo.maxTokens > 0 && (
			<span key="maxTokens">
				<span style={{ fontWeight: 500 }}>最大输出：</span> {modelInfo.maxTokens?.toLocaleString()} tokens
			</span>
		),
		modelInfo.inputPrice !== undefined && modelInfo.inputPrice > 0 && (
			<span key="inputPrice">
				<span style={{ fontWeight: 500 }}>输入价格：</span> {formatPrice(modelInfo.inputPrice)}/百万tokens
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheWritesPrice && (
			<span key="cacheWritesPrice">
				<span style={{ fontWeight: 500 }}>缓存写入价格：</span> {formatPrice(modelInfo.cacheWritesPrice || 0)}
				/百万tokens
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheReadsPrice && (
			<span key="cacheReadsPrice">
				<span style={{ fontWeight: 500 }}>缓存读取价格：</span> {formatPrice(modelInfo.cacheReadsPrice || 0)}
				/百万tokens
			</span>
		),
		modelInfo.outputPrice !== undefined && modelInfo.outputPrice > 0 && (
			<span key="outputPrice">
				<span style={{ fontWeight: 500 }}>输出价格：</span> {formatPrice(modelInfo.outputPrice)}/百万tokens
			</span>
		),
		isGemini && (
			<span key="geminiInfo" style={{ fontStyle: "italic" }}>
				* 每分钟免费使用{selectedModelId && selectedModelId.includes("flash") ? "15" : "2"}次请求。
				超出后，费用取决于提示大小。{" "}
				<VSCodeLink href="https://ai.google.dev/pricing" style={{ display: "inline", fontSize: "inherit" }}>
					查看更多价格详情
				</VSCodeLink>
			</span>
		),
	].filter(Boolean)

	return (
		<div style={{ fontSize: "12px", marginTop: "2px", color: "var(--vscode-descriptionForeground)" }}>
			{infoItems.map((item, index) => (
				<Fragment key={index}>
					{item}
					{index < infoItems.length - 1 && <br />}
				</Fragment>
			))}
		</div>
	)
}

const ModelInfoSupportsItem = ({
	isSupported,
	supportsLabel,
	doesNotSupportLabel,
}: {
	isSupported: boolean
	supportsLabel: string
	doesNotSupportLabel: string
}) => (
	<span
		style={{
			fontWeight: 500,
			color: isSupported ? "var(--vscode-charts-green)" : "var(--vscode-errorForeground)",
		}}>
		<i
			className={`codicon codicon-${isSupported ? "check" : "x"}`}
			style={{
				marginRight: 4,
				marginBottom: isSupported ? 1 : -1,
				fontSize: isSupported ? 11 : 13,
				fontWeight: 700,
				display: "inline-block",
				verticalAlign: "bottom",
			}}></i>
		{isSupported ? supportsLabel : doesNotSupportLabel}
	</span>
)
