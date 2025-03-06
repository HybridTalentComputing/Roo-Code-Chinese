export function getSwitchModeDescription(): string {
	return `## switch_mode
描述：请求切换到不同的模式。此工具允许模式在需要时请求切换到另一个模式，例如切换到代码模式以进行代码更改。用户必须批准模式切换。
参数：
- mode_slug：（必需）要切换到的模式的标识符（例如，"code"、"ask"、"architect"）
- reason：（可选）切换模式的原因
用法：
<switch_mode>
<mode_slug>在此输入模式标识符</mode_slug>
<reason>在此输入切换原因</reason>
</switch_mode>

示例：请求切换到代码模式
<switch_mode>
<mode_slug>code</mode_slug>
<reason>需要进行代码更改</reason>
</switch_mode>`
}
