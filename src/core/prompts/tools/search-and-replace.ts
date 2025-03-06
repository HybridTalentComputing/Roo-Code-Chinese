import { ToolArgs } from "./types"

export function getSearchAndReplaceDescription(args: ToolArgs): string {
	return `## search_and_replace
Description: 请求对文件执行搜索和替换操作。每个操作可以指定搜索模式（字符串或正则表达式）和替换文本，并可选择性地限制行范围和正则表达式标志。在应用更改前会显示差异预览。
Parameters:
- path: (必需) 要修改的文件路径（相对于当前工作目录 ${args.cwd.toPosix()}）
- operations: (必需) 搜索/替换操作的 JSON 数组。每个操作是一个包含以下字段的对象：
    * search: (必需) 要搜索的文本或模式
    * replace: (必需) 用于替换匹配项的文本。如果需要替换多行，使用 "\n" 表示换行
    * start_line: (可选) 限制替换的起始行号
    * end_line: (可选) 限制替换的结束行号
    * use_regex: (可选) 是否将搜索内容作为正则表达式模式处理
    * ignore_case: (可选) 是否在匹配时忽略大小写
    * regex_flags: (可选) 当 use_regex 为 true 时的额外正则表达式标志
Usage:
<search_and_replace>
<path>文件路径</path>
<operations>[
  {
    "search": "要查找的文本",
    "replace": "替换文本",
    "start_line": 1,
    "end_line": 10
  }
]</operations>
</search_and_replace>
示例：在 example.ts 的第 1-10 行中将 "foo" 替换为 "bar"
<search_and_replace>
<path>example.ts</path>
<operations>[
  {
    "search": "foo",
    "replace": "bar",
    "start_line": 1,
    "end_line": 10
  }
]</operations>
</search_and_replace>
示例：使用正则表达式替换所有 "old" 开头的单词
<search_and_replace>
<path>example.ts</path>
<operations>[
  {
    "search": "old\\w+",
    "replace": "new$&",
    "use_regex": true,
    "ignore_case": true
  }
]</operations>
</search_and_replace>`
}
