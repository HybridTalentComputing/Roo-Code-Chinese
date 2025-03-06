import { ToolArgs } from "./types"

export function getBrowserActionDescription(args: ToolArgs): string | undefined {
	if (!args.supportsComputerUse) {
		return undefined
	}
	return `## browser_action
Description: 请求与Puppeteer控制的浏览器进行交互。除了 \`close\` 操作外，每个操作都会返回浏览器当前状态的截图以及任何新的控制台日志。每条消息只能执行一个浏览器操作，并等待包含截图和日志的用户响应来确定下一步操作。
- 操作序列**必须始终以**在URL上启动浏览器开始，并**必须以**关闭浏览器结束。如果需要访问当前网页无法导航到的新URL，必须先关闭浏览器，然后在新URL重新启动。
- 当浏览器处于活动状态时，只能使用 \`browser_action\` 工具。在此期间不应调用其他工具。例如，如果遇到错误需要修复文件，必须先关闭浏览器，然后使用其他工具进行必要的更改，最后重新启动浏览器以验证结果。
- 浏览器窗口分辨率为 **${args.browserViewportSize}** 像素。执行任何点击操作时，确保坐标在此分辨率范围内。
- 在点击图标、链接或按钮等元素之前，必须查看页面的截图以确定元素的坐标。点击应该针对**元素的中心**，而不是边缘。
Parameters:
- action: (必需) 要执行的操作。可用的操作有：
    * launch: 在指定URL启动新的Puppeteer控制的浏览器实例。这**必须是第一个操作**。
        - 使用 \`url\` 参数提供URL。
        - 确保URL有效且包含适当的协议（例如 http://localhost:3000/page, file:///path/to/file.html 等）
    * click: 在特定的x,y坐标处点击。
        - 使用 \`coordinate\` 参数指定位置。
        - 始终根据截图中的坐标点击元素（图标、按钮、链接等）的中心。
    * type: 在键盘上输入文本字符串。可以在点击文本框后使用此操作输入文本。
        - 使用 \`text\` 参数提供要输入的字符串。
    * scroll_down: 向下滚动一个页面高度。
    * scroll_up: 向上滚动一个页面高度。
    * close: 关闭Puppeteer控制的浏览器实例。这**必须是最后一个浏览器操作**。
        - 示例: \`<action>close</action>\`
- url: (可选) 用于为 \`launch\` 操作提供URL。
    * 示例: <url>https://example.com</url>
- coordinate: (可选) \`click\` 操作的X和Y坐标。坐标必须在 **${args.browserViewportSize}** 分辨率范围内。
    * 示例: <coordinate>450,300</coordinate>
- text: (可选) 用于为 \`type\` 操作提供文本。
    * 示例: <text>Hello, world!</text>
使用方法:
<browser_action>
<action>要执行的操作（如 launch, click, type, scroll_down, scroll_up, close）</action>
<url>启动浏览器的URL（可选）</url>
<coordinate>x,y坐标（可选）</coordinate>
<text>要输入的文本（可选）</text>
</browser_action>

示例：请求在 https://example.com 启动浏览器
<browser_action>
<action>launch</action>
<url>https://example.com</url>
</browser_action>

示例：请求点击坐标 450,300 处的元素
<browser_action>
<action>click</action>
<coordinate>450,300</coordinate>
</browser_action>`
}
