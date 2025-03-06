import { ToolArgs } from "./types"

export function getWriteToFileDescription(args: ToolArgs): string {
	return `## write_to_file
描述：请求将完整内容写入指定路径的文件。如果文件已存在，将用提供的内容覆盖它。如果文件不存在，将创建新文件。此工具会自动创建写入文件所需的所有目录。
参数：
- path：（必需）要写入的文件路径（相对于当前工作目录 ${args.cwd}）
- content：（必需）要写入文件的内容。始终提供文件的完整预期内容，不要有任何截断或遗漏。您必须包含文件的所有部分，即使它们没有被修改。但不要在内容中包含行号，只需提供文件的实际内容。
- line_count：（必需）文件中的行数。确保根据文件的实际内容计算行数，而不是根据您提供的内容中的行数计算。
用法：
<write_to_file>
<path>在此处填写文件路径</path>
<content>
在此处填写文件内容
</content>
<line_count>文件的总行数，包括空行</line_count>
</write_to_file>

示例：请求写入 frontend-config.json
<write_to_file>
<path>frontend-config.json</path>
<content>
{
  "apiEndpoint": "https://api.example.com",
  "theme": {
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "fontFamily": "Arial, sans-serif"
  },
  "features": {
    "darkMode": true,
    "notifications": true,
    "analytics": false
  },
  "version": "1.0.0"
}
</content>
<line_count>14</line_count>
</write_to_file>`
}
