import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
	VSCodeButton,
	VSCodeTextArea,
	VSCodeDropdown,
	VSCodeOption,
	VSCodeTextField,
	VSCodeCheckbox,
	VSCodeRadioGroup,
	VSCodeRadio,
} from "@vscode/webview-ui-toolkit/react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"
import {
	Button,
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui"
import { cn } from "@/lib/utils"
import { useExtensionState } from "../../context/ExtensionStateContext"
import {
	Mode,
	PromptComponent,
	getRoleDefinition,
	getCustomInstructions,
	getAllModes,
	ModeConfig,
	GroupEntry,
} from "../../../../src/shared/modes"
import { CustomModeSchema } from "../../../../src/core/config/CustomModesSchema"
import {
	supportPrompt,
	SupportPromptType,
	supportPromptLabels,
	supportPromptDescriptions,
} from "../../../../src/shared/support-prompt"

import { TOOL_GROUPS, GROUP_DISPLAY_NAMES, ToolGroup } from "../../../../src/shared/tool-groups"
import { vscode } from "../../utils/vscode"

// Get all available groups that should show in prompts view
const availableGroups = (Object.keys(TOOL_GROUPS) as ToolGroup[]).filter((group) => !TOOL_GROUPS[group].alwaysAvailable)

type ModeSource = "global" | "project"

type PromptsViewProps = {
	onDone: () => void
}

// Helper to get group name regardless of format
function getGroupName(group: GroupEntry): ToolGroup {
	return Array.isArray(group) ? group[0] : group
}

const PromptsView = ({ onDone }: PromptsViewProps) => {
	const {
		customModePrompts,
		customSupportPrompts,
		listApiConfigMeta,
		currentApiConfigName,
		enhancementApiConfigId,
		setEnhancementApiConfigId,
		mode,
		customInstructions,
		setCustomInstructions,
		preferredLanguage,
		setPreferredLanguage,
		customModes,
	} = useExtensionState()

	// Memoize modes to preserve array order
	const modes = useMemo(() => getAllModes(customModes), [customModes])

	const [testPrompt, setTestPrompt] = useState("")
	const [isEnhancing, setIsEnhancing] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [open, setOpen] = useState(false)
	const [isCustomLanguage, setIsCustomLanguage] = useState(false)
	const [customLanguage, setCustomLanguage] = useState("")
	const [selectedPromptContent, setSelectedPromptContent] = useState("")
	const [selectedPromptTitle, setSelectedPromptTitle] = useState("")
	const [isToolsEditMode, setIsToolsEditMode] = useState(false)
	const [showConfigMenu, setShowConfigMenu] = useState(false)
	const [isCreateModeDialogOpen, setIsCreateModeDialogOpen] = useState(false)
	const [activeSupportTab, setActiveSupportTab] = useState<SupportPromptType>("ENHANCE")
	const [isSystemPromptDisclosureOpen, setIsSystemPromptDisclosureOpen] = useState(false)

	// Direct update functions
	const updateAgentPrompt = useCallback(
		(mode: Mode, promptData: PromptComponent) => {
			const existingPrompt = customModePrompts?.[mode] as PromptComponent
			const updatedPrompt = { ...existingPrompt, ...promptData }

			// Only include properties that differ from defaults
			if (updatedPrompt.roleDefinition === getRoleDefinition(mode)) {
				delete updatedPrompt.roleDefinition
			}

			vscode.postMessage({
				type: "updatePrompt",
				promptMode: mode,
				customPrompt: updatedPrompt,
			})
		},
		[customModePrompts],
	)

	const updateCustomMode = useCallback((slug: string, modeConfig: ModeConfig) => {
		const source = modeConfig.source || "global"
		vscode.postMessage({
			type: "updateCustomMode",
			slug,
			modeConfig: {
				...modeConfig,
				source, // Ensure source is set
			},
		})
	}, [])

	// Helper function to find a mode by slug
	const findModeBySlug = useCallback(
		(searchSlug: string, modes: readonly ModeConfig[] | undefined): ModeConfig | undefined => {
			if (!modes) return undefined
			const isModeWithSlug = (mode: ModeConfig): mode is ModeConfig => mode.slug === searchSlug
			return modes.find(isModeWithSlug)
		},
		[],
	)

	const switchMode = useCallback((slug: string) => {
		vscode.postMessage({
			type: "mode",
			text: slug,
		})
	}, [])

	// Handle mode switching with explicit state initialization
	const handleModeSwitch = useCallback(
		(modeConfig: ModeConfig) => {
			if (modeConfig.slug === mode) return // Prevent unnecessary updates

			// First switch the mode
			switchMode(modeConfig.slug)

			// Exit tools edit mode when switching modes
			setIsToolsEditMode(false)
		},
		[mode, switchMode, setIsToolsEditMode],
	)

	// Helper function to get current mode's config
	const getCurrentMode = useCallback((): ModeConfig | undefined => {
		const findMode = (m: ModeConfig): boolean => m.slug === mode
		return customModes?.find(findMode) || modes.find(findMode)
	}, [mode, customModes, modes])

	// Helper function to safely access mode properties
	const getModeProperty = <T extends keyof ModeConfig>(
		mode: ModeConfig | undefined,
		property: T,
	): ModeConfig[T] | undefined => {
		return mode?.[property]
	}

	// State for create mode dialog
	const [newModeName, setNewModeName] = useState("")
	const [newModeSlug, setNewModeSlug] = useState("")
	const [newModeRoleDefinition, setNewModeRoleDefinition] = useState("")
	const [newModeCustomInstructions, setNewModeCustomInstructions] = useState("")
	const [newModeGroups, setNewModeGroups] = useState<GroupEntry[]>(availableGroups)
	const [newModeSource, setNewModeSource] = useState<ModeSource>("global")

	// Field-specific error states
	const [nameError, setNameError] = useState<string>("")
	const [slugError, setSlugError] = useState<string>("")
	const [roleDefinitionError, setRoleDefinitionError] = useState<string>("")
	const [groupsError, setGroupsError] = useState<string>("")

	// Helper to reset form state
	const resetFormState = useCallback(() => {
		// Reset form fields
		setNewModeName("")
		setNewModeSlug("")
		setNewModeGroups(availableGroups)
		setNewModeRoleDefinition("")
		setNewModeCustomInstructions("")
		setNewModeSource("global")
		// Reset error states
		setNameError("")
		setSlugError("")
		setRoleDefinitionError("")
		setGroupsError("")
	}, [])

	// Reset form fields when dialog opens
	useEffect(() => {
		if (isCreateModeDialogOpen) {
			resetFormState()
		}
	}, [isCreateModeDialogOpen, resetFormState])

	// Helper function to generate a unique slug from a name
	const generateSlug = useCallback((name: string, attempt = 0): string => {
		const baseSlug = name
			.toLowerCase()
			.replace(/[^a-z0-9-]+/g, "-")
			.replace(/^-+|-+$/g, "")
		return attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`
	}, [])

	// Handler for name changes
	const handleNameChange = useCallback(
		(name: string) => {
			setNewModeName(name)
			setNewModeSlug(generateSlug(name))
		},
		[generateSlug],
	)

	const handleCreateMode = useCallback(() => {
		// Clear previous errors
		setNameError("")
		setSlugError("")
		setRoleDefinitionError("")
		setGroupsError("")

		const source = newModeSource
		const newMode: ModeConfig = {
			slug: newModeSlug,
			name: newModeName,
			roleDefinition: newModeRoleDefinition.trim(),
			customInstructions: newModeCustomInstructions.trim() || undefined,
			groups: newModeGroups,
			source,
		}

		// Validate the mode against the schema
		const result = CustomModeSchema.safeParse(newMode)
		if (!result.success) {
			// Map Zod errors to specific fields
			result.error.errors.forEach((error) => {
				const field = error.path[0] as string
				const message = error.message

				switch (field) {
					case "name":
						setNameError(message)
						break
					case "slug":
						setSlugError(message)
						break
					case "roleDefinition":
						setRoleDefinitionError(message)
						break
					case "groups":
						setGroupsError(message)
						break
				}
			})
			return
		}

		updateCustomMode(newModeSlug, newMode)
		switchMode(newModeSlug)
		setIsCreateModeDialogOpen(false)
		resetFormState()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		newModeName,
		newModeSlug,
		newModeRoleDefinition,
		newModeCustomInstructions,
		newModeGroups,
		newModeSource,
		updateCustomMode,
	])

	const isNameOrSlugTaken = useCallback(
		(name: string, slug: string) => {
			return modes.some((m) => m.slug === slug || m.name === name)
		},
		[modes],
	)

	const openCreateModeDialog = useCallback(() => {
		const baseNamePrefix = "New Custom Mode"
		// Find unique name and slug
		let attempt = 0
		let name = baseNamePrefix
		let slug = generateSlug(name)
		while (isNameOrSlugTaken(name, slug)) {
			attempt++
			name = `${baseNamePrefix} ${attempt + 1}`
			slug = generateSlug(name)
		}
		setNewModeName(name)
		setNewModeSlug(slug)
		setIsCreateModeDialogOpen(true)
	}, [generateSlug, isNameOrSlugTaken])

	// Handler for group checkbox changes
	const handleGroupChange = useCallback(
		(group: ToolGroup, isCustomMode: boolean, customMode: ModeConfig | undefined) =>
			(e: Event | React.FormEvent<HTMLElement>) => {
				if (!isCustomMode) return // Prevent changes to built-in modes
				const target = (e as CustomEvent)?.detail?.target || (e.target as HTMLInputElement)
				const checked = target.checked
				const oldGroups = customMode?.groups || []
				let newGroups: GroupEntry[]
				if (checked) {
					newGroups = [...oldGroups, group]
				} else {
					newGroups = oldGroups.filter((g) => getGroupName(g) !== group)
				}
				if (customMode) {
					const source = customMode.source || "global"
					updateCustomMode(customMode.slug, {
						...customMode,
						groups: newGroups,
						source,
					})
				}
			},
		[updateCustomMode],
	)

	// Handle clicks outside the config menu
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (showConfigMenu) {
				setShowConfigMenu(false)
			}
		}

		document.addEventListener("click", handleClickOutside)
		return () => document.removeEventListener("click", handleClickOutside)
	}, [showConfigMenu])

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const message = event.data
			if (message.type === "enhancedPrompt") {
				if (message.text) {
					setTestPrompt(message.text)
				}
				setIsEnhancing(false)
			} else if (message.type === "systemPrompt") {
				if (message.text) {
					setSelectedPromptContent(message.text)
					setSelectedPromptTitle(`System Prompt (${message.mode} mode)`)
					setIsDialogOpen(true)
				}
			}
		}

		window.addEventListener("message", handler)
		return () => window.removeEventListener("message", handler)
	}, [])

	const updateSupportPrompt = (type: SupportPromptType, value: string | undefined) => {
		vscode.postMessage({
			type: "updateSupportPrompt",
			values: {
				[type]: value,
			},
		})
	}

	const handleAgentReset = (modeSlug: string, type: "roleDefinition" | "customInstructions") => {
		// Only reset for built-in modes
		const existingPrompt = customModePrompts?.[modeSlug] as PromptComponent
		const updatedPrompt = { ...existingPrompt }
		delete updatedPrompt[type] // Remove the field entirely to ensure it reloads from defaults

		vscode.postMessage({
			type: "updatePrompt",
			promptMode: modeSlug,
			customPrompt: updatedPrompt,
		})
	}

	const handleSupportReset = (type: SupportPromptType) => {
		vscode.postMessage({
			type: "resetSupportPrompt",
			text: type,
		})
	}

	const getSupportPromptValue = (type: SupportPromptType): string => {
		return supportPrompt.get(customSupportPrompts, type)
	}

	const handleTestEnhancement = () => {
		if (!testPrompt.trim()) return

		setIsEnhancing(true)
		vscode.postMessage({
			type: "enhancePrompt",
			text: testPrompt,
		})
	}

	return (
		<div className="fixed inset-0 flex flex-col">
			<div className="flex justify-between items-center px-5 py-2.5">
				<h3 className="text-vscode-foreground m-0">提示词</h3>
				<VSCodeButton onClick={onDone}>完成</VSCodeButton>
			</div>

			<div className="flex-1 overflow-auto px-5">
				<div className="pb-5 border-b border-vscode-input-border">
					<div className="mb-5">
						<div className="font-bold mb-1">首选语言</div>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="combobox"
									role="combobox"
									aria-expanded={open}
									className="w-full justify-between">
									{preferredLanguage ?? "选择语言..."}
									<CaretSortIcon className="opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="p-0">
								<Command>
									<CommandInput placeholder="搜索语言..." className="h-9" />
									<CommandList>
										<CommandGroup>
											{[
												{ value: "English", label: "英语 - English" },
												{ value: "Arabic", label: "阿拉伯语 - العربية" },
												{
													value: "Brazilian Portuguese",
													label: "巴西葡萄牙语 - Português (Brasil)",
												},
												{ value: "Catalan", label: "加泰罗尼亚语 - Català" },
												{ value: "Czech", label: "捷克语 - Čeština" },
												{ value: "French", label: "法语 - Français" },
												{ value: "German", label: "德语 - Deutsch" },
												{ value: "Hindi", label: "印地语 - हिन्दी" },
												{ value: "Hungarian", label: "匈牙利语 - Magyar" },
												{ value: "Italian", label: "意大利语 - Italiano" },
												{ value: "Japanese", label: "日语 - 日本語" },
												{ value: "Korean", label: "韩语 - 한국어" },
												{ value: "Polish", label: "波兰语 - Polski" },
												{ value: "Portuguese", label: "葡萄牙语 - Português (Portugal)" },
												{ value: "Russian", label: "俄语 - Русский" },
												{ value: "Simplified Chinese", label: "简体中文" },
												{ value: "Spanish", label: "西班牙语 - Español" },
												{
													value: "Traditional Chinese",
													label: "繁体中文 - 繁體中文",
												},
												{ value: "Turkish", label: "土耳其语 - Türkçe" },
											].map((language) => (
												<CommandItem
													key={language.value}
													value={language.value}
													onSelect={(value) => {
														setPreferredLanguage(value)
														vscode.postMessage({
															type: "preferredLanguage",
															text: value,
														})
														setOpen(false)
													}}>
													{language.label}
													<CheckIcon
														className={cn(
															"ml-auto",
															preferredLanguage === language.value
																? "opacity-100"
																: "opacity-0",
														)}
													/>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
								<div className="border-t border-[var(--vscode-input-border)]">
									<button
										className="w-full px-2 py-1.5 text-sm text-left hover:bg-[var(--vscode-list-hoverBackground)]"
										onClick={() => {
											setIsCustomLanguage(true)
											setOpen(false)
										}}>
										+ 选择其他语言
									</button>
								</div>
							</PopoverContent>
						</Popover>
						<p className="text-xs mt-1.5 text-vscode-descriptionForeground">
							选择Roo与您交流时使用的语言。
						</p>
					</div>

					<div className="font-bold mb-1">所有模式的自定义指令</div>
					<div className="text-sm text-vscode-descriptionForeground mb-2">
						这些指令适用于所有模式。它们提供了一组基础行为，可以通过下方的模式特定指令进行增强。
					</div>
					<VSCodeTextArea
						value={customInstructions ?? ""}
						onChange={(e) => {
							const value =
								(e as CustomEvent)?.detail?.target?.value ||
								((e as any).target as HTMLTextAreaElement).value
							setCustomInstructions(value || undefined)
							vscode.postMessage({
								type: "customInstructions",
								text: value.trim() || undefined,
							})
						}}
						rows={4}
						resize="vertical"
						className="w-full"
						data-testid="global-custom-instructions-textarea"
					/>
					<div className="text-xs text-vscode-descriptionForeground mt-1.5 mb-10">
						指令也可以从工作区的{" "}
						<span
							className="text-vscode-textLink-foreground cursor-pointer underline"
							onClick={() =>
								vscode.postMessage({
									type: "openFile",
									text: "./.clinerules",
									values: {
										create: true,
										content: "",
									},
								})
							}>
							.clinerules
						</span>{" "}
						文件中加载。
					</div>
				</div>

				<div className="mt-5">
					<div onClick={(e) => e.stopPropagation()} className="flex justify-between items-center mb-3">
						<h3 className="text-vscode-foreground m-0">Modes</h3>
						<div className="flex gap-2">
							<VSCodeButton appearance="icon" onClick={openCreateModeDialog} title="创建新模式">
								<span className="codicon codicon-add"></span>
							</VSCodeButton>
							<div className="relative inline-block">
								<VSCodeButton
									appearance="icon"
									title="编辑模式配置"
									className="flex"
									onClick={(e: React.MouseEvent) => {
										e.preventDefault()
										e.stopPropagation()
										setShowConfigMenu((prev) => !prev)
									}}
									onBlur={() => {
										// Add slight delay to allow menu item clicks to register
										setTimeout(() => setShowConfigMenu(false), 200)
									}}>
									<span className="codicon codicon-json"></span>
								</VSCodeButton>
								{showConfigMenu && (
									<div
										onClick={(e) => e.stopPropagation()}
										onMouseDown={(e) => e.stopPropagation()}
										className="absolute top-full right-0 w-[200px] mt-1 bg-vscode-editor-background border border-vscode-input-border rounded shadow-md z-[1000]">
										<div
											className="p-2 cursor-pointer text-vscode-foreground text-sm"
											onMouseDown={(e) => {
												e.preventDefault() // Prevent blur
												vscode.postMessage({
													type: "openCustomModesSettings",
												})
												setShowConfigMenu(false)
											}}
											onClick={(e) => e.preventDefault()}>
											编辑全局模式
										</div>
										<div
											className="p-2 cursor-pointer text-vscode-foreground text-sm border-t border-vscode-input-border"
											onMouseDown={(e) => {
												e.preventDefault() // Prevent blur
												vscode.postMessage({
													type: "openFile",
													text: "./.roomodes",
													values: {
														create: true,
														content: JSON.stringify({ customModes: [] }, null, 2),
													},
												})
												setShowConfigMenu(false)
											}}
											onClick={(e) => e.preventDefault()}>
											编辑项目模式 (.roomodes)
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="text-sm text-vscode-descriptionForeground mb-3">
						点击 + 创建新的自定义模式，或者直接在聊天中让 Roo 帮你创建！
					</div>

					<div className="flex gap-2 items-center mb-3 flex-wrap py-1">
						{modes.map((modeConfig) => {
							const isActive = mode === modeConfig.slug
							return (
								<button
									key={modeConfig.slug}
									data-testid={`${modeConfig.slug}-tab`}
									data-active={isActive ? "true" : "false"}
									onClick={() => handleModeSwitch(modeConfig)}
									className={`px-2 py-1 border-none rounded cursor-pointer font-bold ${
										isActive
											? "bg-vscode-button-background text-vscode-button-foreground opacity-100"
											: "bg-transparent text-vscode-foreground opacity-80"
									}`}>
									{modeConfig.name}
								</button>
							)
						})}
					</div>
				</div>

				<div style={{ marginBottom: "20px" }}>
					{/* Only show name and delete for custom modes */}
					{mode && findModeBySlug(mode, customModes) && (
						<div className="flex gap-3 mb-4">
							<div className="flex-1">
								<div className="font-bold mb-1">Name</div>
								<div className="flex gap-2">
									<VSCodeTextField
										value={getModeProperty(findModeBySlug(mode, customModes), "name") ?? ""}
										onChange={(e: Event | React.FormEvent<HTMLElement>) => {
											const target =
												(e as CustomEvent)?.detail?.target ||
												((e as any).target as HTMLInputElement)
											const customMode = findModeBySlug(mode, customModes)
											if (customMode) {
												updateCustomMode(mode, {
													...customMode,
													name: target.value,
													source: customMode.source || "global",
												})
											}
										}}
										className="w-full"
									/>
									<VSCodeButton
										appearance="icon"
										title="删除模式"
										onClick={() => {
											vscode.postMessage({
												type: "deleteCustomMode",
												slug: mode,
											})
										}}>
										<span className="codicon codicon-trash"></span>
									</VSCodeButton>
								</div>
							</div>
						</div>
					)}
					<div style={{ marginBottom: "16px" }}>
						<div className="flex justify-between items-center mb-1">
							<div className="font-bold">角色定义</div>
							{!findModeBySlug(mode, customModes) && (
								<VSCodeButton
									appearance="icon"
									onClick={() => {
										const currentMode = getCurrentMode()
										if (currentMode?.slug) {
											handleAgentReset(currentMode.slug, "roleDefinition")
										}
									}}
									title="重置为默认值"
									data-testid="role-definition-reset">
									<span className="codicon codicon-discard"></span>
								</VSCodeButton>
							)}
						</div>
						<div className="text-sm text-vscode-descriptionForeground mb-2">
							为此模式定义Roo的专业知识和个性。这段描述将塑造Roo如何展现自己以及如何处理任务。
						</div>
						<VSCodeTextArea
							value={(() => {
								const customMode = findModeBySlug(mode, customModes)
								const prompt = customModePrompts?.[mode] as PromptComponent
								return customMode?.roleDefinition ?? prompt?.roleDefinition ?? getRoleDefinition(mode)
							})()}
							onChange={(e) => {
								const value =
									(e as CustomEvent)?.detail?.target?.value ||
									((e as any).target as HTMLTextAreaElement).value
								const customMode = findModeBySlug(mode, customModes)
								if (customMode) {
									// For custom modes, update the JSON file
									updateCustomMode(mode, {
										...customMode,
										roleDefinition: value.trim() || "",
										source: customMode.source || "global",
									})
								} else {
									// For built-in modes, update the prompts
									updateAgentPrompt(mode, {
										roleDefinition: value.trim() || undefined,
									})
								}
							}}
							rows={4}
							resize="vertical"
							style={{ width: "100%" }}
							data-testid={`${getCurrentMode()?.slug || "code"}-prompt-textarea`}
						/>
					</div>
					{/* Mode settings */}
					<>
						<div style={{ marginBottom: "12px" }}>
							<div style={{ fontWeight: "bold", marginBottom: "4px" }}>API 配置</div>
							<div style={{ marginBottom: "8px" }}>
								<VSCodeDropdown
									value={currentApiConfigName || ""}
									onChange={(e: any) => {
										const value = e.detail?.target?.value || e.target?.value
										vscode.postMessage({
											type: "loadApiConfiguration",
											text: value,
										})
									}}
									className="w-full">
									{(listApiConfigMeta || []).map((config) => (
										<VSCodeOption key={config.id} value={config.name}>
											{config.name}
										</VSCodeOption>
									))}
								</VSCodeDropdown>
								<div className="text-xs mt-1.5 text-vscode-descriptionForeground">
									选择要用于此模式的 API 配置
								</div>
							</div>
						</div>

						{/* Show tools for all modes */}
						<div className="mb-4">
							<div className="flex justify-between items-center mb-1">
								<div className="font-bold">可用工具</div>
								{findModeBySlug(mode, customModes) && (
									<VSCodeButton
										appearance="icon"
										onClick={() => setIsToolsEditMode(!isToolsEditMode)}
										title={isToolsEditMode ? "完成编辑" : "编辑工具"}>
										<span
											className={`codicon codicon-${isToolsEditMode ? "check" : "edit"}`}></span>
									</VSCodeButton>
								)}
							</div>
							{!findModeBySlug(mode, customModes) && (
								<div className="text-sm text-vscode-descriptionForeground mb-2">
									内置模式的工具不能被修改
								</div>
							)}
							{isToolsEditMode && findModeBySlug(mode, customModes) ? (
								<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
									{availableGroups.map((group) => {
										const currentMode = getCurrentMode()
										const isCustomMode = findModeBySlug(mode, customModes)
										const customMode = isCustomMode
										const isGroupEnabled = isCustomMode
											? customMode?.groups?.some((g) => getGroupName(g) === group)
											: currentMode?.groups?.some((g) => getGroupName(g) === group)

										return (
											<VSCodeCheckbox
												key={group}
												checked={isGroupEnabled}
												onChange={handleGroupChange(group, Boolean(isCustomMode), customMode)}
												disabled={!isCustomMode}>
												{GROUP_DISPLAY_NAMES[group]}
												{group === "edit" && (
													<div className="text-xs text-vscode-descriptionForeground mt-0.5">
														允许的文件：{" "}
														{(() => {
															const currentMode = getCurrentMode()
															const editGroup = currentMode?.groups?.find(
																(g) =>
																	Array.isArray(g) &&
																	g[0] === "edit" &&
																	g[1]?.fileRegex,
															)
															if (!Array.isArray(editGroup)) return "所有文件"
															return (
																editGroup[1].description ||
																`/${editGroup[1].fileRegex}/`
															)
														})()}
													</div>
												)}
											</VSCodeCheckbox>
										)
									})}
								</div>
							) : (
								<div className="text-sm text-vscode-foreground mb-2 leading-relaxed">
									{(() => {
										const currentMode = getCurrentMode()
										const enabledGroups = currentMode?.groups || []
										return enabledGroups
											.map((group) => {
												const groupName = getGroupName(group)
												const displayName = GROUP_DISPLAY_NAMES[groupName]
												if (Array.isArray(group) && group[1]?.fileRegex) {
													const description =
														group[1].description || `/${group[1].fileRegex}/`
													return `${displayName} (${description})`
												}
												return displayName
											})
											.join(", ")
									})()}
								</div>
							)}
						</div>
					</>

					{/* Role definition for both built-in and custom modes */}
					<div style={{ marginBottom: "8px" }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "4px",
							}}>
							<div style={{ fontWeight: "bold" }}>模式特定自定义指令（可选）</div>
							{!findModeBySlug(mode, customModes) && (
								<VSCodeButton
									appearance="icon"
									onClick={() => {
										const currentMode = getCurrentMode()
										if (currentMode?.slug) {
											handleAgentReset(currentMode.slug, "customInstructions")
										}
									}}
									title="重置为默认值"
									data-testid="custom-instructions-reset">
									<span className="codicon codicon-discard"></span>
								</VSCodeButton>
							)}
						</div>
						<div
							style={{
								fontSize: "13px",
								color: "var(--vscode-descriptionForeground)",
								marginBottom: "8px",
							}}>
							添加 {getCurrentMode()?.name || "代码"} 模式的特定行为指导。
						</div>
						<VSCodeTextArea
							value={(() => {
								const customMode = findModeBySlug(mode, customModes)
								const prompt = customModePrompts?.[mode] as PromptComponent
								return (
									customMode?.customInstructions ??
									prompt?.customInstructions ??
									getCustomInstructions(mode, customModes)
								)
							})()}
							onChange={(e) => {
								const value =
									(e as CustomEvent)?.detail?.target?.value ||
									((e as any).target as HTMLTextAreaElement).value
								const customMode = findModeBySlug(mode, customModes)
								if (customMode) {
									// For custom modes, update the JSON file
									updateCustomMode(mode, {
										...customMode,
										customInstructions: value.trim() || undefined,
										source: customMode.source || "global",
									})
								} else {
									// For built-in modes, update the prompts
									const existingPrompt = customModePrompts?.[mode] as PromptComponent
									updateAgentPrompt(mode, {
										...existingPrompt,
										customInstructions: value.trim(),
									})
								}
							}}
							rows={4}
							resize="vertical"
							style={{ width: "100%" }}
							data-testid={`${getCurrentMode()?.slug || "code"}-custom-instructions-textarea`}
						/>
						<div
							style={{
								fontSize: "12px",
								color: "var(--vscode-descriptionForeground)",
								marginTop: "5px",
							}}>
							{getCurrentMode()?.name || "代码"} 模式的特定指令也可以从 加载
							<span
								style={{
									color: "var(--vscode-textLink-foreground)",
									cursor: "pointer",
									textDecoration: "underline",
								}}
								onClick={() => {
									const currentMode = getCurrentMode()
									if (!currentMode) return

									// Open or create an empty file
									vscode.postMessage({
										type: "openFile",
										text: `./.clinerules-${currentMode.slug}`,
										values: {
											create: true,
											content: "",
										},
									})
								}}>
								.clinerules-{getCurrentMode()?.slug || "code"}
							</span>{" "}
							在你的工作区。
						</div>
					</div>
				</div>
				<div
					style={{
						paddingBottom: "40px",
						marginBottom: "20px",
						borderBottom: "1px solid var(--vscode-input-border)",
					}}>
					<div style={{ display: "flex", gap: "8px" }}>
						<VSCodeButton
							appearance="primary"
							onClick={() => {
								const currentMode = getCurrentMode()
								if (currentMode) {
									vscode.postMessage({
										type: "getSystemPrompt",
										mode: currentMode.slug,
									})
								}
							}}
							data-testid="preview-prompt-button">
							预览系统提示词
						</VSCodeButton>
						<VSCodeButton
							appearance="icon"
							title="复制系统提示词到剪贴板"
							onClick={() => {
								const currentMode = getCurrentMode()
								if (currentMode) {
									vscode.postMessage({
										type: "copySystemPrompt",
										mode: currentMode.slug,
									})
								}
							}}
							data-testid="copy-prompt-button">
							<span className="codicon codicon-copy"></span>
						</VSCodeButton>
					</div>

					{/* Custom System Prompt Disclosure */}
					<div className="mb-3 mt-12">
						<button
							onClick={() => setIsSystemPromptDisclosureOpen(!isSystemPromptDisclosureOpen)}
							className="flex items-center text-xs text-vscode-foreground hover:text-vscode-textLink-foreground focus:outline-none"
							aria-expanded={isSystemPromptDisclosureOpen}>
							<span
								className={`codicon codicon-${isSystemPromptDisclosureOpen ? "chevron-down" : "chevron-right"} mr-1`}></span>
							<span>高级：覆盖系统提示词</span>
						</button>

						{isSystemPromptDisclosureOpen && (
							<div className="text-xs text-vscode-descriptionForeground mt-2 ml-5">
								您可以通过创建文件来完全替换此模式的系统提示（除了角色定义和自定义指令外） 文件位置：{" "}
								<span
									className="text-vscode-textLink-foreground cursor-pointer underline"
									onClick={() => {
										const currentMode = getCurrentMode()
										if (!currentMode) return

										// Open or create an empty file
										vscode.postMessage({
											type: "openFile",
											text: `./.roo/system-prompt-${currentMode.slug}`,
											values: {
												create: true,
												content: "",
											},
										})
									}}>
									在您的工作区中的 .roo/system-prompt-{getCurrentMode()?.slug || "code"}
								</span>{" "}
								文件。这是一个高级功能，会绕过内置的安全保护和一致性检查（特别是在工具使用方面），请谨慎使用！
							</div>
						)}
					</div>
				</div>

				<div
					style={{
						marginTop: "20px",
						paddingBottom: "60px",
						borderBottom: "1px solid var(--vscode-input-border)",
					}}>
					<h3 style={{ color: "var(--vscode-foreground)", marginBottom: "12px" }}>辅助提示词</h3>
					<div
						style={{
							display: "flex",
							gap: "8px",
							alignItems: "center",
							marginBottom: "12px",
							flexWrap: "wrap",
							padding: "4px 0",
						}}>
						{Object.keys(supportPrompt.default).map((type) => (
							<button
								key={type}
								data-testid={`${type}-tab`}
								data-active={activeSupportTab === type ? "true" : "false"}
								onClick={() => setActiveSupportTab(type as SupportPromptType)}
								style={{
									padding: "4px 8px",
									border: "none",
									background: activeSupportTab === type ? "var(--vscode-button-background)" : "none",
									color:
										activeSupportTab === type
											? "var(--vscode-button-foreground)"
											: "var(--vscode-foreground)",
									cursor: "pointer",
									opacity: activeSupportTab === type ? 1 : 0.8,
									borderRadius: "3px",
									fontWeight: "bold",
								}}>
								{supportPromptLabels[type as SupportPromptType]}
							</button>
						))}
					</div>

					{/* Support prompt description */}
					<div
						style={{
							fontSize: "13px",
							color: "var(--vscode-descriptionForeground)",
							margin: "8px 0 16px",
						}}>
						{supportPromptDescriptions[activeSupportTab]}
					</div>

					{/* Show active tab content */}
					<div key={activeSupportTab}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "4px",
							}}>
							<div style={{ fontWeight: "bold" }}>Prompt</div>
							<VSCodeButton
								appearance="icon"
								onClick={() => handleSupportReset(activeSupportTab)}
								title={`Reset ${activeSupportTab} prompt to default`}>
								<span className="codicon codicon-discard"></span>
							</VSCodeButton>
						</div>

						<VSCodeTextArea
							value={getSupportPromptValue(activeSupportTab)}
							onChange={(e) => {
								const value =
									(e as CustomEvent)?.detail?.target?.value ||
									((e as any).target as HTMLTextAreaElement).value
								const trimmedValue = value.trim()
								updateSupportPrompt(activeSupportTab, trimmedValue || undefined)
							}}
							rows={6}
							resize="vertical"
							style={{ width: "100%" }}
						/>

						{activeSupportTab === "ENHANCE" && (
							<>
								<div>
									<div
										style={{
											color: "var(--vscode-foreground)",
											fontSize: "13px",
											marginBottom: "20px",
											marginTop: "5px",
										}}></div>
									<div style={{ marginBottom: "12px" }}>
										<div style={{ marginBottom: "8px" }}>
											<div style={{ fontWeight: "bold", marginBottom: "4px" }}>API 配置</div>
											<div
												style={{
													fontSize: "13px",
													color: "var(--vscode-descriptionForeground)",
												}}>
												您可以选择一个固定的API配置用于增强提示， 或者使用当前选择的配置
											</div>
										</div>
										<VSCodeDropdown
											value={enhancementApiConfigId || ""}
											data-testid="api-config-dropdown"
											onChange={(e: any) => {
												const value = e.detail?.target?.value || e.target?.value
												setEnhancementApiConfigId(value)
												vscode.postMessage({
													type: "enhancementApiConfigId",
													text: value,
												})
											}}
											style={{ width: "300px" }}>
											<VSCodeOption value="">使用当前选择的 API 配置</VSCodeOption>
											{(listApiConfigMeta || []).map((config) => (
												<VSCodeOption key={config.id} value={config.id}>
													{config.name}
												</VSCodeOption>
											))}
										</VSCodeDropdown>
									</div>
								</div>

								<div style={{ marginTop: "12px" }}>
									<VSCodeTextArea
										value={testPrompt}
										onChange={(e) => setTestPrompt((e.target as HTMLTextAreaElement).value)}
										placeholder="输入提示以测试增强功能"
										rows={3}
										resize="vertical"
										style={{ width: "100%" }}
										data-testid="test-prompt-textarea"
									/>
									<div
										style={{
											marginTop: "8px",
											display: "flex",
											justifyContent: "flex-start",
											alignItems: "center",
											gap: 8,
										}}>
										<VSCodeButton
											onClick={handleTestEnhancement}
											disabled={isEnhancing}
											appearance="primary">
											预览提示增强
										</VSCodeButton>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			{isCreateModeDialogOpen && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						display: "flex",
						justifyContent: "flex-end",
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						zIndex: 1000,
					}}>
					<div
						style={{
							width: "calc(100vw - 100px)",
							height: "100%",
							backgroundColor: "var(--vscode-editor-background)",
							boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.2)",
							display: "flex",
							flexDirection: "column",
							position: "relative",
						}}>
						<div
							style={{
								flex: 1,
								padding: "20px",
								overflowY: "auto",
								minHeight: 0,
							}}>
							<VSCodeButton
								appearance="icon"
								onClick={() => setIsCreateModeDialogOpen(false)}
								style={{
									position: "absolute",
									top: "20px",
									right: "20px",
								}}>
								<span className="codicon codicon-close"></span>
							</VSCodeButton>
							<h2 style={{ margin: "0 0 16px" }}>创建新模式</h2>
							<div style={{ marginBottom: "16px" }}>
								<div style={{ fontWeight: "bold", marginBottom: "4px" }}>名称</div>
								<VSCodeTextField
									value={newModeName}
									onChange={(e: Event | React.FormEvent<HTMLElement>) => {
										const target =
											(e as CustomEvent)?.detail?.target ||
											((e as any).target as HTMLInputElement)
										handleNameChange(target.value)
									}}
									style={{ width: "100%" }}
								/>
								{nameError && (
									<div className="text-xs text-vscode-errorForeground mt-1">{nameError}</div>
								)}
							</div>
							<div style={{ marginBottom: "16px" }}>
								<div style={{ fontWeight: "bold", marginBottom: "4px" }}>标识符</div>
								<VSCodeTextField
									value={newModeSlug}
									onChange={(e: Event | React.FormEvent<HTMLElement>) => {
										const target =
											(e as CustomEvent)?.detail?.target ||
											((e as any).target as HTMLInputElement)
										setNewModeSlug(target.value)
									}}
									style={{ width: "100%" }}
								/>
								<div
									style={{
										fontSize: "12px",
										color: "var(--vscode-descriptionForeground)",
										marginTop: "4px",
									}}>
									标识符用于 URL 和文件名。应该使用小写字母，只能包含字母、数字和连字符。
								</div>
								{slugError && (
									<div className="text-xs text-vscode-errorForeground mt-1">{slugError}</div>
								)}
							</div>
							<div style={{ marginBottom: "16px" }}>
								<div style={{ fontWeight: "bold", marginBottom: "4px" }}>保存位置</div>
								<div className="text-sm text-vscode-descriptionForeground mb-2">
									选择保存此模式的位置。项目特定的模式优先于全局模式。
								</div>
								<VSCodeRadioGroup
									value={newModeSource}
									onChange={(e: Event | React.FormEvent<HTMLElement>) => {
										const target = ((e as CustomEvent)?.detail?.target ||
											(e.target as HTMLInputElement)) as HTMLInputElement
										setNewModeSource(target.value as ModeSource)
									}}>
									<VSCodeRadio value="global">
										全局
										<div
											style={{
												fontSize: "12px",
												color: "var(--vscode-descriptionForeground)",
												marginTop: "2px",
											}}>
											在所有工作区中可用
										</div>
									</VSCodeRadio>
									<VSCodeRadio value="project">
										项目特定 (.roomodes)
										<div className="text-xs text-vscode-descriptionForeground mt-0.5">
											仅在此工作区可用，优先于全局设置
										</div>
									</VSCodeRadio>
								</VSCodeRadioGroup>
							</div>

							<div style={{ marginBottom: "16px" }}>
								<div style={{ fontWeight: "bold", marginBottom: "4px" }}>角色定义</div>
								<div
									style={{
										fontSize: "13px",
										color: "var(--vscode-descriptionForeground)",
										marginBottom: "8px",
									}}>
									为此模式定义 Roo 的专业知识和个性。
								</div>
								<VSCodeTextArea
									value={newModeRoleDefinition}
									onChange={(e) => {
										const value =
											(e as CustomEvent)?.detail?.target?.value ||
											((e as any).target as HTMLTextAreaElement).value
										setNewModeRoleDefinition(value)
									}}
									rows={4}
									resize="vertical"
									style={{ width: "100%" }}
								/>
								{roleDefinitionError && (
									<div className="text-xs text-vscode-errorForeground mt-1">
										{roleDefinitionError}
									</div>
								)}
							</div>
							<div style={{ marginBottom: "16px" }}>
								<div style={{ fontWeight: "bold", marginBottom: "4px" }}>可用工具</div>
								<div
									style={{
										fontSize: "13px",
										color: "var(--vscode-descriptionForeground)",
										marginBottom: "8px",
									}}>
									选择此模式可以使用的工具。
								</div>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
										gap: "8px",
									}}>
									{availableGroups.map((group) => (
										<VSCodeCheckbox
											key={group}
											checked={newModeGroups.some((g) => getGroupName(g) === group)}
											onChange={(e: Event | React.FormEvent<HTMLElement>) => {
												const target =
													(e as CustomEvent)?.detail?.target || (e.target as HTMLInputElement)
												const checked = target.checked
												if (checked) {
													setNewModeGroups([...newModeGroups, group])
												} else {
													setNewModeGroups(
														newModeGroups.filter((g) => getGroupName(g) !== group),
													)
												}
											}}>
											{GROUP_DISPLAY_NAMES[group]}
										</VSCodeCheckbox>
									))}
								</div>
								{groupsError && (
									<div className="text-xs text-vscode-errorForeground mt-1">{groupsError}</div>
								)}
							</div>
							<div style={{ marginBottom: "16px" }}>
								<div style={{ fontWeight: "bold", marginBottom: "4px" }}>自定义指令（可选）</div>
								<div
									style={{
										fontSize: "13px",
										color: "var(--vscode-descriptionForeground)",
										marginBottom: "8px",
									}}>
									添加此模式特有的行为指导。
								</div>
								<VSCodeTextArea
									value={newModeCustomInstructions}
									onChange={(e) => {
										const value =
											(e as CustomEvent)?.detail?.target?.value ||
											((e as any).target as HTMLTextAreaElement).value
										setNewModeCustomInstructions(value)
									}}
									rows={4}
									resize="vertical"
									style={{ width: "100%" }}
								/>
							</div>
						</div>
						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								padding: "12px 20px",
								gap: "8px",
								borderTop: "1px solid var(--vscode-editor-lineHighlightBorder)",
								backgroundColor: "var(--vscode-editor-background)",
							}}>
							<VSCodeButton onClick={() => setIsCreateModeDialogOpen(false)}>取消</VSCodeButton>
							<VSCodeButton appearance="primary" onClick={handleCreateMode}>
								创建模式
							</VSCodeButton>
						</div>
					</div>
				</div>
			)}
			{isDialogOpen && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						display: "flex",
						justifyContent: "flex-end",
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						zIndex: 1000,
					}}>
					<div
						style={{
							width: "calc(100vw - 100px)",
							height: "100%",
							backgroundColor: "var(--vscode-editor-background)",
							boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.2)",
							display: "flex",
							flexDirection: "column",
							position: "relative",
						}}>
						<div
							style={{
								flex: 1,
								padding: "20px",
								overflowY: "auto",
								minHeight: 0,
							}}>
							<VSCodeButton
								appearance="icon"
								onClick={() => setIsDialogOpen(false)}
								style={{
									position: "absolute",
									top: "20px",
									right: "20px",
								}}>
								<span className="codicon codicon-close"></span>
							</VSCodeButton>
							<h2 style={{ margin: "0 0 16px" }}>{selectedPromptTitle}</h2>
							<pre
								style={{
									padding: "8px",
									whiteSpace: "pre-wrap",
									wordBreak: "break-word",
									fontFamily: "var(--vscode-editor-font-family)",
									fontSize: "var(--vscode-editor-font-size)",
									color: "var(--vscode-editor-foreground)",
									backgroundColor: "var(--vscode-editor-background)",
									border: "1px solid var(--vscode-editor-lineHighlightBorder)",
									borderRadius: "4px",
									overflowY: "auto",
								}}>
								{selectedPromptContent}
							</pre>
						</div>
						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								padding: "12px 20px",
								borderTop: "1px solid var(--vscode-editor-lineHighlightBorder)",
								backgroundColor: "var(--vscode-editor-background)",
							}}>
							<VSCodeButton onClick={() => setIsDialogOpen(false)}>关闭</VSCodeButton>
						</div>
					</div>
				</div>
			)}
			{isCustomLanguage && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-[var(--vscode-editor-background)] p-6 rounded-lg w-96">
						<h3 className="text-lg font-semibold mb-4">Add Custom Language</h3>
						<input
							type="text"
							className="w-full p-2 mb-4 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
							placeholder="输入语言名称"
							value={customLanguage}
							onChange={(e) => setCustomLanguage(e.target.value)}
						/>
						<div className="flex justify-end gap-2">
							<Button variant="secondary" onClick={() => setIsCustomLanguage(false)}>
								取消
							</Button>
							<Button
								onClick={() => {
									if (customLanguage.trim()) {
										setPreferredLanguage(customLanguage.trim())
										vscode.postMessage({
											type: "preferredLanguage",
											text: customLanguage.trim(),
										})
										setIsCustomLanguage(false)
										setCustomLanguage("")
									}
								}}
								disabled={!customLanguage.trim()}>
								添加
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default PromptsView
