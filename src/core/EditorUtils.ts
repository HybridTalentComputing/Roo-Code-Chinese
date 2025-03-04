import * as vscode from "vscode"
import * as path from "path"

/**
 * 表示文档中的有效范围及其对应的文本。
 */
export interface EffectiveRange {
	/** 文档中的范围。 */
	range: vscode.Range
	/** 指定范围内的文本。 */
	text: string
}

/**
 * 表示从VSCode诊断信息中提取的诊断数据。
 */
export interface DiagnosticData {
	/** 诊断消息。 */
	message: string
	/** 诊断的严重程度。 */
	severity: vscode.DiagnosticSeverity
	/**
	 * 可选的诊断代码。
	 * 可以是字符串、数字或包含值和目标的对象。
	 */
	code?: string | number | { value: string | number; target: vscode.Uri }
	/** 可选的诊断源标识符（例如，扩展名）。 */
	source?: string
	/** 诊断适用的文档范围。 */
	range: vscode.Range
}

/**
 * VSCode文本编辑器的上下文信息。
 */
export interface EditorContext {
	/** 当前文档的文件路径。 */
	filePath: string
	/** 从文档中选择或派生的有效文本。 */
	selectedText: string
	/** 与有效范围关联的可选诊断列表。 */
	diagnostics?: DiagnosticData[]
}

/**
 * 提供VSCode编辑器和文档操作辅助方法的工具类。
 */
export class EditorUtils {
	/** 缓存文本文档到其计算的文件路径的映射。 */
	private static readonly filePathCache = new WeakMap<vscode.TextDocument, string>()

	/**
	 * 根据用户的选择从给定文档计算有效的文本范围。
	 * 如果选择非空，则直接返回。
	 * 否则，如果当前行非空，则扩展范围以包含相邻行。
	 *
	 * @param document - 要提取文本的文档。
	 * @param range - 用户选择的范围或选区。
	 * @returns 包含有效范围及其文本的EffectiveRange对象，如果未找到有效文本则返回null。
	 */
	static getEffectiveRange(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
	): EffectiveRange | null {
		try {
			const selectedText = document.getText(range)
			if (selectedText) {
				return { range, text: selectedText }
			}

			const currentLine = document.lineAt(range.start.line)
			if (!currentLine.text.trim()) {
				return null
			}

			const startLineIndex = Math.max(0, currentLine.lineNumber - 1)
			const endLineIndex = Math.min(document.lineCount - 1, currentLine.lineNumber + 1)

			const effectiveRange = new vscode.Range(
				new vscode.Position(startLineIndex, 0),
				new vscode.Position(endLineIndex, document.lineAt(endLineIndex).text.length),
			)

			return {
				range: effectiveRange,
				text: document.getText(effectiveRange),
			}
		} catch (error) {
			console.error("获取有效范围时出错:", error)
			return null
		}
	}

	/**
	 * 获取给定文本文档的文件路径。
	 * 使用内部缓存以避免重复计算。
	 * 如果文档属于工作区，尝试计算相对路径；否则，返回绝对fsPath。
	 *
	 * @param document - 要获取文件路径的文本文档。
	 * @returns 文件路径字符串。
	 */
	static getFilePath(document: vscode.TextDocument): string {
		let filePath = this.filePathCache.get(document)
		if (filePath) {
			return filePath
		}

		try {
			const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
			if (!workspaceFolder) {
				filePath = document.uri.fsPath
			} else {
				const relativePath = path.relative(workspaceFolder.uri.fsPath, document.uri.fsPath)
				filePath = !relativePath || relativePath.startsWith("..") ? document.uri.fsPath : relativePath
			}

			this.filePathCache.set(document, filePath)
			return filePath
		} catch (error) {
			console.error("获取文件路径时出错:", error)
			return document.uri.fsPath
		}
	}

	/**
	 * 将VSCode诊断对象转换为本地DiagnosticData实例。
	 *
	 * @param diagnostic - 要转换的VSCode诊断信息。
	 * @returns 对应的DiagnosticData对象。
	 */
	static createDiagnosticData(diagnostic: vscode.Diagnostic): DiagnosticData {
		return {
			message: diagnostic.message,
			severity: diagnostic.severity,
			code: diagnostic.code,
			source: diagnostic.source,
			range: diagnostic.range,
		}
	}

	/**
	 * 判断两个VSCode范围是否相交。
	 *
	 * @param range1 - 第一个范围。
	 * @param range2 - 第二个范围。
	 * @returns 如果范围相交则返回true；否则返回false。
	 */
	static hasIntersectingRange(range1: vscode.Range, range2: vscode.Range): boolean {
		if (
			range1.end.line < range2.start.line ||
			(range1.end.line === range2.start.line && range1.end.character <= range2.start.character)
		) {
			return false
		}
		if (
			range2.end.line < range1.start.line ||
			(range2.end.line === range1.start.line && range2.end.character <= range1.start.character)
		) {
			return false
		}
		return true
	}

	/**
	 * 从提供的文本编辑器或活动文本编辑器构建编辑器上下文。
	 * 上下文包括文件路径、有效的选定文本以及与有效范围相交的任何诊断信息。
	 *
	 * @param editor - （可选）特定的文本编辑器实例。如果未提供，则使用活动文本编辑器。
	 * @returns 如果成功则返回EditorContext对象；否则返回null。
	 */
	static getEditorContext(editor?: vscode.TextEditor): EditorContext | null {
		try {
			if (!editor) {
				editor = vscode.window.activeTextEditor
			}
			if (!editor) {
				return null
			}

			const document = editor.document
			const selection = editor.selection
			const effectiveRange = this.getEffectiveRange(document, selection)

			if (!effectiveRange) {
				return null
			}

			const filePath = this.getFilePath(document)
			const diagnostics = vscode.languages
				.getDiagnostics(document.uri)
				.filter((d) => this.hasIntersectingRange(effectiveRange.range, d.range))
				.map(this.createDiagnosticData)

			return {
				filePath,
				selectedText: effectiveRange.text,
				...(diagnostics.length > 0 ? { diagnostics } : {}),
			}
		} catch (error) {
			console.error("获取编辑器上下文时出错:", error)
			return null
		}
	}
}
