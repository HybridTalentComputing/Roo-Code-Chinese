import { Anthropic } from "@anthropic-ai/sdk"
import { ConversationRole, Message, ContentBlock } from "@aws-sdk/client-bedrock-runtime"

import { MessageContent } from "../../shared/api"

/**
 * 将 Anthropic 消息转换为 Bedrock Converse 格式
 */
export function convertToBedrockConverseMessages(anthropicMessages: Anthropic.Messages.MessageParam[]): Message[] {
	return anthropicMessages.map((anthropicMessage) => {
		// 将 Anthropic 角色映射到 Bedrock 角色
		const role: ConversationRole = anthropicMessage.role === "assistant" ? "assistant" : "user"

		if (typeof anthropicMessage.content === "string") {
			return {
				role,
				content: [
					{
						text: anthropicMessage.content,
					},
				] as ContentBlock[],
			}
		}

		// 处理复杂内容类型
		const content = anthropicMessage.content.map((block) => {
			const messageBlock = block as MessageContent & {
				id?: string
				tool_use_id?: string
				content?: Array<{ type: string; text: string }>
				output?: string | Array<{ type: string; text: string }>
			}

			if (messageBlock.type === "text") {
				return {
					text: messageBlock.text || "",
				} as ContentBlock
			}

			if (messageBlock.type === "image" && messageBlock.source) {
				// 如果需要，将 base64 字符串转换为字节数组
				let byteArray: Uint8Array
				if (typeof messageBlock.source.data === "string") {
					const binaryString = atob(messageBlock.source.data)
					byteArray = new Uint8Array(binaryString.length)
					for (let i = 0; i < binaryString.length; i++) {
						byteArray[i] = binaryString.charCodeAt(i)
					}
				} else {
					byteArray = messageBlock.source.data
				}

				// 从 media_type 中提取格式（例如，"image/jpeg" -> "jpeg"）
				const format = messageBlock.source.media_type.split("/")[1]
				if (!["png", "jpeg", "gif", "webp"].includes(format)) {
					throw new Error(`不支持的图片格式: ${format}`)
				}

				return {
					image: {
						format: format as "png" | "jpeg" | "gif" | "webp",
						source: {
							bytes: byteArray,
						},
					},
				} as ContentBlock
			}

			if (messageBlock.type === "tool_use") {
				// 将工具使用转换为 XML 格式
				const toolParams = Object.entries(messageBlock.input || {})
					.map(([key, value]) => `<${key}>\n${value}\n</${key}>`)
					.join("\n")

				return {
					toolUse: {
						toolUseId: messageBlock.id || "",
						name: messageBlock.name || "",
						input: `<${messageBlock.name}>\n${toolParams}\n</${messageBlock.name}>`,
					},
				} as ContentBlock
			}

			if (messageBlock.type === "tool_result") {
				// 如果有可用的 content，优先使用
				if (messageBlock.content && Array.isArray(messageBlock.content)) {
					return {
						toolResult: {
							toolUseId: messageBlock.tool_use_id || "",
							content: messageBlock.content.map((item) => ({
								text: item.text,
							})),
							status: "success",
						},
					} as ContentBlock
				}

				// 如果 content 不可用，回退到处理 output
				if (messageBlock.output && typeof messageBlock.output === "string") {
					return {
						toolResult: {
							toolUseId: messageBlock.tool_use_id || "",
							content: [
								{
									text: messageBlock.output,
								},
							],
							status: "success",
						},
					} as ContentBlock
				}
				// 如果 output 是数组，处理内容块数组
				if (Array.isArray(messageBlock.output)) {
					return {
						toolResult: {
							toolUseId: messageBlock.tool_use_id || "",
							content: messageBlock.output.map((part) => {
								if (typeof part === "object" && "text" in part) {
									return { text: part.text }
								}
								// 跳过工具结果中的图片，因为它们会被单独处理
								if (typeof part === "object" && "type" in part && part.type === "image") {
									return { text: "(请查看下一条消息中的图片)" }
								}
								return { text: String(part) }
							}),
							status: "success",
						},
					} as ContentBlock
				}

				// 默认情况
				return {
					toolResult: {
						toolUseId: messageBlock.tool_use_id || "",
						content: [
							{
								text: String(messageBlock.output || ""),
							},
						],
						status: "success",
					},
				} as ContentBlock
			}

			if (messageBlock.type === "video") {
				const videoContent = messageBlock.s3Location
					? {
							s3Location: {
								uri: messageBlock.s3Location.uri,
								bucketOwner: messageBlock.s3Location.bucketOwner,
							},
						}
					: messageBlock.source

				return {
					video: {
						format: "mp4", // 默认使用 mp4，根据实际格式调整
						source: videoContent,
					},
				} as ContentBlock
			}

			// 未知块类型的默认处理
			return {
				text: "[未知块类型]",
			} as ContentBlock
		})

		return {
			role,
			content,
		}
	})
}
