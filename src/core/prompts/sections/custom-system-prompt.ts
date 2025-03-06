import fs from "fs/promises"
import path from "path"
import { Mode } from "../../../shared/modes"
import { fileExistsAtPath } from "../../../utils/fs"

/**
 * 安全地读取文件，如果文件不存在则返回空字符串
 */
async function safeReadFile(filePath: string): Promise<string> {
	try {
		const content = await fs.readFile(filePath, "utf-8")
		// 使用 "utf-8" 编码读取时，内容应该是字符串
		return content.trim()
	} catch (err) {
		const errorCode = (err as NodeJS.ErrnoException).code
		if (!errorCode || !["ENOENT", "EISDIR"].includes(errorCode)) {
			throw err
		}
		return ""
	}
}

/**
 * 获取特定模式的系统提示词文件路径
 */
export function getSystemPromptFilePath(cwd: string, mode: Mode): string {
	return path.join(cwd, ".roo", `system-prompt-${mode}`)
}

/**
 * 从 .roo/system-prompt-[mode slug] 文件加载自定义系统提示词
 * 如果文件不存在，则返回空字符串
 */
export async function loadSystemPromptFile(cwd: string, mode: Mode): Promise<string> {
	const filePath = getSystemPromptFilePath(cwd, mode)
	return safeReadFile(filePath)
}

/**
 * 确保 .roo 目录存在，如果不存在则创建
 */
export async function ensureRooDirectory(cwd: string): Promise<void> {
	const rooDir = path.join(cwd, ".roo")

	// 检查目录是否已存在
	if (await fileExistsAtPath(rooDir)) {
		return
	}

	// 创建目录
	try {
		await fs.mkdir(rooDir, { recursive: true })
	} catch (err) {
		// 如果目录已存在（竞态条件），忽略错误
		const errorCode = (err as NodeJS.ErrnoException).code
		if (errorCode !== "EEXIST") {
			throw err
		}
	}
}
