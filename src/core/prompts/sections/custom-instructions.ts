import fs from "fs/promises"
import path from "path"

/**
 * 安全地读取文件内容，如果文件不存在则返回空字符串
 */
async function safeReadFile(filePath: string): Promise<string> {
	try {
		const content = await fs.readFile(filePath, "utf-8")
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
 * 加载规则文件
 */
export async function loadRuleFiles(cwd: string): Promise<string> {
	const ruleFiles = [".clinerules", ".cursorrules", ".windsurfrules"]
	let combinedRules = ""

	for (const file of ruleFiles) {
		const content = await safeReadFile(path.join(cwd, file))
		if (content) {
			combinedRules += `\n# 来自 ${file} 的规则:\n${content}\n`
		}
	}

	return combinedRules
}

/**
 * 添加自定义指令
 */
export async function addCustomInstructions(
	modeCustomInstructions: string,
	globalCustomInstructions: string,
	cwd: string,
	mode: string,
	options: { preferredLanguage?: string } = {},
): Promise<string> {
	const sections = []

	// 如果提供了模式，则加载模式特定的规则
	let modeRuleContent = ""
	if (mode) {
		const modeRuleFile = `.clinerules-${mode}`
		modeRuleContent = await safeReadFile(path.join(cwd, modeRuleFile))
	}

	// 如果提供了语言偏好，则添加语言设置
	if (options.preferredLanguage) {
		sections.push(`语言偏好：\n你应该始终使用 ${options.preferredLanguage} 语言思考和交流。`)
	}

	// 首先添加全局指令
	if (typeof globalCustomInstructions === "string" && globalCustomInstructions.trim()) {
		sections.push(`全局指令：\n${globalCustomInstructions.trim()}`)
	}

	// 然后添加模式特定指令
	if (typeof modeCustomInstructions === "string" && modeCustomInstructions.trim()) {
		sections.push(`模式特定指令：\n${modeCustomInstructions.trim()}`)
	}

	// 添加规则 - 包括模式特定规则和通用规则（如果存在）
	const rules = []

	// 如果存在模式特定规则，则首先添加
	if (modeRuleContent && modeRuleContent.trim()) {
		const modeRuleFile = `.clinerules-${mode}`
		rules.push(`# 来自 ${modeRuleFile} 的规则：\n${modeRuleContent}`)
	}

	// 添加通用规则
	const genericRuleContent = await loadRuleFiles(cwd)
	if (genericRuleContent && genericRuleContent.trim()) {
		rules.push(genericRuleContent.trim())
	}

	if (rules.length > 0) {
		sections.push(`规则：\n\n${rules.join("\n\n")}`)
	}

	const joinedSections = sections.join("\n\n")

	return joinedSections
		? `
====

用户自定义指令

以下是用户提供的附加指令，你应该在不影响工具使用指南的前提下尽可能地遵循这些指令。

${joinedSections}`
		: ""
}
