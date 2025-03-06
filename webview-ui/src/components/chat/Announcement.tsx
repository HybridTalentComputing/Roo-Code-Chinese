import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { memo } from "react"

interface AnnouncementProps {
	version: string
	hideAnnouncement: () => void
}
/*
You must update the latestAnnouncementId in ClineProvider for new announcements to show to users. This new id will be compared with whats in state for the 'last announcement shown', and if it's different then the announcement will render. As soon as an announcement is shown, the id will be updated in state. This ensures that announcements are not shown more than once, even if the user doesn't close it themselves.
*/
const Announcement = ({ version, hideAnnouncement }: AnnouncementProps) => {
	return (
		<div
			style={{
				backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)",
				borderRadius: "3px",
				padding: "12px 16px",
				margin: "5px 15px 5px 15px",
				position: "relative",
				flexShrink: 0,
			}}>
			<VSCodeButton
				appearance="icon"
				onClick={hideAnnouncement}
				title="隐藏公告"
				style={{ position: "absolute", top: "8px", right: "8px" }}>
				<span className="codicon codicon-close"></span>
			</VSCodeButton>
			<h2 style={{ margin: "0 0 8px" }}>🎉{"  "}自动检查点功能现已启用</h2>

			<p style={{ margin: "5px 0px" }}>
				我们很高兴地宣布，实验性的检查点功能现已默认为所有用户启用。这个强大的功能可以在任务执行期间自动追踪您的项目更改，让您能够快速查看或恢复到之前的状态。
			</p>

			<h3 style={{ margin: "12px 0 8px" }}>新功能介绍</h3>
			<p style={{ margin: "5px 0px" }}>
				自动检查点为您提供：
				<ul style={{ margin: "4px 0 6px 20px", padding: 0 }}>
					<li>在进行重大更改时提供安全保障</li>
					<li>可视化检查各步骤之间的更改</li>
					<li>如果对某些代码修改不满意，可以轻松回滚</li>
					<li>改进复杂任务执行过程的导航体验</li>
				</ul>
			</p>

			<h3 style={{ margin: "12px 0 8px" }}>自定义您的体验</h3>
			<p style={{ margin: "5px 0px" }}>
				虽然我们建议保持此功能启用，但您可以根据需要禁用它。{" "}
				<VSCodeLink
					href="#"
					onClick={(e) => {
						e.preventDefault()
						window.postMessage({ type: "action", action: "settingsButtonClicked" }, "*")
					}}
					style={{ display: "inline", padding: "0 2px" }}>
					打开设置
				</VSCodeLink>{" "}
				在高级设置部分查找"启用自动检查点
			</p>
		</div>
	)
}

export default memo(Announcement)
