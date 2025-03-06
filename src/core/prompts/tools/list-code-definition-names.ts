import { ToolArgs } from "./types"

export function getListCodeDefinitionNamesDescription(args: ToolArgs): string {
	return `## list_code_definition_names
Description: 请求列出指定目录中源代码文件顶层的定义名称（类、函数、方法等）。该工具提供代码库结构和重要构造的洞察，封装了对理解整体架构至关重要的高层概念和关系。
Parameters:
- path: (必需) 要列出顶层源代码定义的目录路径（相对于当前工作目录 ${args.cwd}）。
Usage:
<list_code_definition_names>
<path>在此处填写目录路径</path>
</list_code_definition_names>

Example: 请求列出当前目录中所有顶层源代码定义
<list_code_definition_names>
<path>.</path>
</list_code_definition_names>`
}
