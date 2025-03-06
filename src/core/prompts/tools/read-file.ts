import { ToolArgs } from "./types"

export function getReadFileDescription(args: ToolArgs): string {
	return `## read_file
描述：请求读取指定路径文件的内容。当您需要检查一个您不知道内容的现有文件时使用此工具，例如分析代码、查看文本文件或从配置文件中提取信息。输出内容会在每行前添加行号（例如："1 | const x = 1"），这样在创建差异或讨论代码时更容易引用特定行。可以自动从PDF和DOCX文件中提取原始文本。可能不适用于其他类型的二进制文件，因为它会将原始内容作为字符串返回。
参数：
- path：（必需）要读取的文件路径（相对于当前工作目录 ${args.cwd}）
用法：
<read_file>
<path>在此处填写文件路径</path>
</read_file>

示例：请求读取frontend-config.json文件
<read_file>
<path>frontend-config.json</path>
</read_file>`
}
