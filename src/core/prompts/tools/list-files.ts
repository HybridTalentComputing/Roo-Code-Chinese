import { ToolArgs } from "./types"

export function getListFilesDescription(args: ToolArgs): string {
	return `## list_files
描述：请求列出指定目录中的文件和目录。如果recursive为true，将递归列出所有文件和目录；如果recursive为false或未提供，则仅列出顶层内容。请勿使用此工具来确认您可能已创建的文件是否存在，因为用户会告知您文件是否创建成功。
参数：
- path：（必需）要列出内容的目录路径（相对于当前工作目录 ${args.cwd}）
- recursive：（可选）是否递归列出文件。使用true进行递归列出，使用false或省略则仅列出顶层内容。
用法：
<list_files>
<path>在此处填写目录路径</path>
<recursive>true或false（可选）</recursive>
</list_files>

示例：请求列出当前目录中的所有文件
<list_files>
<path>.</path>
<recursive>false</recursive>
</list_files>`
}
