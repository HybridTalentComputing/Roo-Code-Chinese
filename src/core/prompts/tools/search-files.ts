import { ToolArgs } from "./types"

export function getSearchFilesDescription(args: ToolArgs): string {
	return `## search_files
描述：请求在指定目录中执行正则表达式搜索，提供上下文丰富的结果。此工具在多个文件中搜索模式或特定内容，显示每个匹配项及其上下文。
参数：
- path：（必需）要搜索的目录路径（相对于当前工作目录 ${args.cwd}）。将递归搜索此目录。
- regex：（必需）要搜索的正则表达式模式。使用 Rust 正则表达式语法。
- file_pattern：（可选）用于过滤文件的 Glob 模式（例如，'*.ts' 表示 TypeScript 文件）。如果未提供，将搜索所有文件 (*)。
用法：
<search_files>
<path>在此处填写目录路径</path>
<regex>在此处填写正则表达式模式</regex>
<file_pattern>在此处填写文件模式（可选）</file_pattern>
</search_files>

示例：请求搜索当前目录中的所有 .ts 文件
<search_files>
<path>.</path>
<regex>.*</regex>
<file_pattern>*.ts</file_pattern>
</search_files>`
}
