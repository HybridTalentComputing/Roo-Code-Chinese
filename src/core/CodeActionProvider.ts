import * as vscode from "vscode"
import { EditorUtils } from "./EditorUtils"

export const ACTION_NAMES = {
	EXPLAIN: "Roo Code: 解释代码",
	FIX: "Roo Code: 修复代码",
	FIX_LOGIC: "Roo Code: 修复逻辑",
	IMPROVE: "Roo Code: 改进代码",
	ADD_TO_CONTEXT: "Roo Code: 添加到上下文",
} as const

export const COMMAND_IDS = {
	EXPLAIN: "roo-cline-chinese.explainCode",
	FIX: "roo-cline-chinese.fixCode",
	IMPROVE: "roo-cline-chinese.improveCode",
	ADD_TO_CONTEXT: "roo-cline-chinese.addToContext",
} as const

export class CodeActionProvider implements vscode.CodeActionProvider {
	// 提供的代码操作类型
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix,
		vscode.CodeActionKind.RefactorRewrite,
	]

	// 创建代码操作
	private createAction(title: string, kind: vscode.CodeActionKind, command: string, args: any[]): vscode.CodeAction {
		const action = new vscode.CodeAction(title, kind)
		action.command = { command, title, arguments: args }
		return action
	}

	// 创建一对代码操作（新任务和当前任务）
	private createActionPair(
		baseTitle: string,
		kind: vscode.CodeActionKind,
		baseCommand: string,
		args: any[],
	): vscode.CodeAction[] {
		return [
			this.createAction(`${baseTitle} 在新任务中`, kind, baseCommand, args),
			this.createAction(`${baseTitle} 在当前任务中`, kind, `${baseCommand}InCurrentTask`, args),
		]
	}

	// 提供代码操作
	public provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		try {
			const effectiveRange = EditorUtils.getEffectiveRange(document, range)
			if (!effectiveRange) {
				return []
			}

			const filePath = EditorUtils.getFilePath(document)
			const actions: vscode.CodeAction[] = []

			actions.push(
				...this.createActionPair(ACTION_NAMES.EXPLAIN, vscode.CodeActionKind.QuickFix, COMMAND_IDS.EXPLAIN, [
					filePath,
					effectiveRange.text,
				]),
			)

			if (context.diagnostics.length > 0) {
				const relevantDiagnostics = context.diagnostics.filter((d) =>
					EditorUtils.hasIntersectingRange(effectiveRange.range, d.range),
				)

				if (relevantDiagnostics.length > 0) {
					const diagnosticMessages = relevantDiagnostics.map(EditorUtils.createDiagnosticData)
					actions.push(
						...this.createActionPair(ACTION_NAMES.FIX, vscode.CodeActionKind.QuickFix, COMMAND_IDS.FIX, [
							filePath,
							effectiveRange.text,
							diagnosticMessages,
						]),
					)
				}
			} else {
				actions.push(
					...this.createActionPair(ACTION_NAMES.FIX_LOGIC, vscode.CodeActionKind.QuickFix, COMMAND_IDS.FIX, [
						filePath,
						effectiveRange.text,
					]),
				)
			}

			actions.push(
				...this.createActionPair(
					ACTION_NAMES.IMPROVE,
					vscode.CodeActionKind.RefactorRewrite,
					COMMAND_IDS.IMPROVE,
					[filePath, effectiveRange.text],
				),
			)

			actions.push(
				this.createAction(
					ACTION_NAMES.ADD_TO_CONTEXT,
					vscode.CodeActionKind.QuickFix,
					COMMAND_IDS.ADD_TO_CONTEXT,
					[filePath, effectiveRange.text],
				),
			)

			return actions
		} catch (error) {
			console.error("提供代码操作时出错:", error)
			return []
		}
	}
}
