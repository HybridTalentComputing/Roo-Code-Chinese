import { Anthropic } from "@anthropic-ai/sdk"

/**
 * 将复杂的内容块转换为简单的字符串内容
 */
export function convertToSimpleContent(content: Anthropic.Messages.MessageParam["content"]): string {
	if (typeof content === "string") {
		return content
	}

	// 从内容块中提取文本
	return content
		.map((block) => {
			if (block.type === "text") {
				return block.text
			}
			if (block.type === "image") {
				return `[图片: ${block.source.media_type}]`
			}
			if (block.type === "tool_use") {
				return `[工具使用: ${block.name}]`
			}
			if (block.type === "tool_result") {
				if (typeof block.content === "string") {
					return block.content
				}
				if (Array.isArray(block.content)) {
					return block.content
						.map((part) => {
							if (part.type === "text") {
								return part.text
							}
							if (part.type === "image") {
								return `[图片: ${part.source.media_type}]`
							}
							return ""
						})
						.join("\n")
				}
				return ""
			}
			return ""
		})
		.filter(Boolean)
		.join("\n")
}

/**
 * 将Anthropic消息转换为带有字符串内容的简单格式
 */
export function convertToSimpleMessages(
	messages: Anthropic.Messages.MessageParam[],
): Array<{ role: "user" | "assistant"; content: string }> {
	return messages.map((message) => ({
		role: message.role,
		content: convertToSimpleContent(message.content),
	}))
}
