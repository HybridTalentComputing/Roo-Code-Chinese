import fs from "fs/promises"
import os from "os"
import * as path from "path"
import { globby } from "globby"
import simpleGit, { SimpleGit } from "simple-git"

import { GIT_DISABLED_SUFFIX, GIT_EXCLUDES } from "./constants"
import { CheckpointService, CheckpointServiceOptions, CheckpointEventEmitter } from "./types"

export interface ShadowCheckpointServiceOptions extends CheckpointServiceOptions {
	shadowDir: string
}

export class ShadowCheckpointService extends CheckpointEventEmitter implements CheckpointService {
	public readonly version = 1

	private _checkpoints: string[] = []
	private _baseHash?: string
	private _isInitialized = false

	public get baseHash() {
		return this._baseHash
	}

	private set baseHash(value: string | undefined) {
		this._baseHash = value
	}

	public get isInitialized() {
		return this._isInitialized
	}

	private set isInitialized(value: boolean) {
		this._isInitialized = value
	}

	private readonly shadowGitDir: string
	private shadowGitConfigWorktree?: string

	private constructor(
		public readonly taskId: string,
		public readonly git: SimpleGit,
		public readonly shadowDir: string,
		public readonly workspaceDir: string,
		private readonly log: (message: string) => void,
	) {
		super()
		this.shadowGitDir = path.join(this.shadowDir, "tasks", this.taskId, "checkpoints", ".git")
	}

	public async initShadowGit() {
		if (this.isInitialized) {
			return
		}

		const fileExistsAtPath = (path: string) =>
			fs
				.access(path)
				.then(() => true)
				.catch(() => false)

		let created = false
		const startTime = Date.now()

		if (await fileExistsAtPath(this.shadowGitDir)) {
			this.log(`[CheckpointService#initShadowGit] shadow git repo already exists at ${this.shadowGitDir}`)
			const worktree = await this.getShadowGitConfigWorktree()

			if (worktree !== this.workspaceDir) {
				throw new Error(
					`Checkpoints can only be used in the original workspace: ${worktree} !== ${this.workspaceDir}`,
				)
			}

			this.baseHash = await this.git.revparse(["--abbrev-ref", "HEAD"])
		} else {
			this.log(`[CheckpointService#initShadowGit] creating shadow git repo at ${this.workspaceDir}`)

			await this.git.init()
			await this.git.addConfig("core.worktree", this.workspaceDir) // Sets the working tree to the current workspace.
			await this.git.addConfig("commit.gpgSign", "false") // Disable commit signing for shadow repo.
			await this.git.addConfig("user.name", "Roo Code Chinese")
			await this.git.addConfig("user.email", "noreply@example.com")

			let lfsPatterns: string[] = [] // Get LFS patterns from workspace if they exist.

			try {
				const attributesPath = path.join(this.workspaceDir, ".gitattributes")

				if (await fileExistsAtPath(attributesPath)) {
					lfsPatterns = (await fs.readFile(attributesPath, "utf8"))
						.split("\n")
						.filter((line) => line.includes("filter=lfs"))
						.map((line) => line.split(" ")[0].trim())
				}
			} catch (error) {
				this.log(
					`[CheckpointService#initShadowGit] failed to read .gitattributes: ${error instanceof Error ? error.message : String(error)}`,
				)
			}

			// Add basic excludes directly in git config, while respecting any
			// .gitignore in the workspace.
			// .git/info/exclude is local to the shadow git repo, so it's not
			// shared with the main repo - and won't conflict with user's
			// .gitignore.
			await fs.mkdir(path.join(this.shadowGitDir, "info"), { recursive: true })
			const excludesPath = path.join(this.shadowGitDir, "info", "exclude")
			await fs.writeFile(excludesPath, [...GIT_EXCLUDES, ...lfsPatterns].join("\n"))
			await this.stageAll()
			const { commit } = await this.git.commit("initial commit", { "--allow-empty": null })
			this.baseHash = commit
			this.log(`[CheckpointService#initShadowGit] base commit is ${commit}`)

			created = true
		}

		const duration = Date.now() - startTime
		this.log(`[CheckpointService#initShadowGit] initialized shadow git in ${duration}ms`)

		this.isInitialized = true

		this.emit("initialize", {
			type: "initialize",
			workspaceDir: this.workspaceDir,
			baseHash: this.baseHash,
			created,
			duration,
		})
	}

	private async stageAll() {
		await this.renameNestedGitRepos(true)

		try {
			await this.git.add(".")
		} catch (error) {
			this.log(
				`[CheckpointService#stageAll] failed to add files to git: ${error instanceof Error ? error.message : String(error)}`,
			)
		} finally {
			await this.renameNestedGitRepos(false)
		}
	}

	// Since we use git to track checkpoints, we need to temporarily disable
	// nested git repos to work around git's requirement of using submodules for
	// nested repos.
	private async renameNestedGitRepos(disable: boolean) {
		// Find all .git directories that are not at the root level.
		const gitPaths = await globby("**/.git" + (disable ? "" : GIT_DISABLED_SUFFIX), {
			cwd: this.workspaceDir,
			onlyDirectories: true,
			ignore: [".git"], // Ignore root level .git.
			dot: true,
			markDirectories: false,
		})

		// For each nested .git directory, rename it based on operation.
		for (const gitPath of gitPaths) {
			const fullPath = path.join(this.workspaceDir, gitPath)
			let newPath: string

			if (disable) {
				newPath = fullPath + GIT_DISABLED_SUFFIX
			} else {
				newPath = fullPath.endsWith(GIT_DISABLED_SUFFIX)
					? fullPath.slice(0, -GIT_DISABLED_SUFFIX.length)
					: fullPath
			}

			try {
				await fs.rename(fullPath, newPath)
				this.log(
					`[CheckpointService#renameNestedGitRepos] ${disable ? "disabled" : "enabled"} nested git repo ${gitPath}`,
				)
			} catch (error) {
				this.log(
					`[CheckpointService#renameNestedGitRepos] failed to ${disable ? "disable" : "enable"} nested git repo ${gitPath}: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		}
	}

	public async getShadowGitConfigWorktree() {
		if (!this.shadowGitConfigWorktree) {
			try {
				this.shadowGitConfigWorktree = (await this.git.getConfig("core.worktree")).value || undefined
			} catch (error) {
				this.log(
					`[CheckpointService#getShadowGitConfigWorktree] failed to get core.worktree: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		}

		return this.shadowGitConfigWorktree
	}

	public async saveCheckpoint(message: string) {
		try {
			this.log("[CheckpointService#saveCheckpoint] starting checkpoint save")

			if (!this.isInitialized) {
				throw new Error("Shadow git repo not initialized")
			}

			const startTime = Date.now()
			await this.stageAll()
			const result = await this.git.commit(message)
			const isFirst = this._checkpoints.length === 0
			const fromHash = this._checkpoints[this._checkpoints.length - 1] ?? this.baseHash!
			const toHash = result.commit ?? fromHash
			this._checkpoints.push(toHash)
			const duration = Date.now() - startTime
			this.emit("checkpoint", { type: "checkpoint", isFirst, fromHash, toHash, duration })
			return result.commit ? result : undefined
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e))
			this.log(`[CheckpointService#saveCheckpoint] failed to create checkpoint: ${error.message}`)
			this.emit("error", { type: "error", error })
			throw error
		}
	}

	public async restoreCheckpoint(commitHash: string) {
		try {
			if (!this.isInitialized) {
				throw new Error("Shadow git repo not initialized")
			}

			const start = Date.now()
			await this.git.clean("f", ["-d", "-f"])
			await this.git.reset(["--hard", commitHash])

			// Remove all checkpoints after the specified commitHash.
			const checkpointIndex = this._checkpoints.indexOf(commitHash)

			if (checkpointIndex !== -1) {
				this._checkpoints = this._checkpoints.slice(0, checkpointIndex + 1)
			}

			const duration = Date.now() - start
			this.emit("restore", { type: "restore", commitHash, duration })
			this.log(`[CheckpointService#restoreCheckpoint] restored checkpoint ${commitHash} in ${duration}ms`)
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e))
			this.log(`[CheckpointService#restoreCheckpoint] failed to restore checkpoint: ${error.message}`)
			this.emit("error", { type: "error", error })
			throw error
		}
	}

	public async getDiff({ from, to }: { from?: string; to?: string }) {
		if (!this.isInitialized) {
			throw new Error("Shadow git repo not initialized")
		}

		const result = []

		if (!from) {
			from = (await this.git.raw(["rev-list", "--max-parents=0", "HEAD"])).trim()
		}

		// Stage all changes so that untracked files appear in diff summary.
		await this.stageAll()

		const { files } = to ? await this.git.diffSummary([`${from}..${to}`]) : await this.git.diffSummary([from])

		const cwdPath = (await this.getShadowGitConfigWorktree()) || this.workspaceDir || ""

		for (const file of files) {
			const relPath = file.file
			const absPath = path.join(cwdPath, relPath)
			const before = await this.git.show([`${from}:${relPath}`]).catch(() => "")

			const after = to
				? await this.git.show([`${to}:${relPath}`]).catch(() => "")
				: await fs.readFile(absPath, "utf8").catch(() => "")

			result.push({ paths: { relative: relPath, absolute: absPath }, content: { before, after } })
		}

		return result
	}

	public static async create({ taskId, shadowDir, workspaceDir, log = console.log }: ShadowCheckpointServiceOptions) {
		try {
			await simpleGit().version()
		} catch (error) {
			log("[CheckpointService#create] git is not installed")
			throw new Error("Git must be installed to use checkpoints.")
		}

		const homedir = os.homedir()
		const desktopPath = path.join(homedir, "Desktop")
		const documentsPath = path.join(homedir, "Documents")
		const downloadsPath = path.join(homedir, "Downloads")
		const protectedPaths = [homedir, desktopPath, documentsPath, downloadsPath]

		if (protectedPaths.includes(workspaceDir)) {
			throw new Error(`Cannot use checkpoints in ${workspaceDir}`)
		}

		const checkpointsDir = path.join(shadowDir, "tasks", taskId, "checkpoints")
		await fs.mkdir(checkpointsDir, { recursive: true })
		const gitDir = path.join(checkpointsDir, ".git")
		const git = simpleGit(path.dirname(gitDir))

		log(`[CheckpointService#create] taskId = ${taskId}, workspaceDir = ${workspaceDir}, shadowDir = ${shadowDir}`)
		return new ShadowCheckpointService(taskId, git, shadowDir, workspaceDir, log)
	}
}
