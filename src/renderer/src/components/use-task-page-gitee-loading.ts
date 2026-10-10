import type { TaskPageProviderMetadataModel } from './use-task-page-provider-metadata'
import { useEffect } from 'react'
import type { GiteeTaskItem } from '../../../shared/gitee-issue-types'
import type { GiteePullRequestInfo } from '../../../shared/gitee-pull-request-types'
import type { GiteeProjectInfo } from '../../../shared/gitee-project-types'

export function useTaskPageGiteeLoading(model: TaskPageProviderMetadataModel) {
  const {
    selectedRepos,
    selectedReposKey,
    taskSource,
    setGiteeItems,
    setGiteeLoading,
    setGiteeError,
    giteeMode,
    setGiteePullRequests,
    giteeRefreshNonce,
    setGiteeProjects,
    giteeFilter
  } = model
  useEffect(() => {
    if (taskSource !== 'gitee') {
      return
    }
    if (selectedRepos.length === 0) {
      setGiteeItems([])
      setGiteePullRequests([])
      setGiteeProjects([])
      setGiteeLoading(false)
      setGiteeError(null)
      return
    }
    let stale = false
    setGiteeLoading(true)
    setGiteeError(null)
    void Promise.all(
      selectedRepos.filter((repo) => /(?:^|[/:@])gitee\.com[/:]/i.test(repo.gitRemoteIdentity?.remoteUrl?.trim() ?? '')).map(async (repo) => {
        if (giteeMode === 'prs') {
          const items = await window.api.gitee.listPullRequests({
            repoPath: repo.path,
            repoId: repo.id,
            limit: 50
          })
          return { repoId: repo.id, result: { items, error: undefined } }
        }
        if (giteeMode === 'projects') {
          const items = await window.api.gitee.listProjects({
            repoPath: repo.path,
            repoId: repo.id,
            limit: 50
          })
          return { repoId: repo.id, result: { items, error: undefined } }
        }
        const result = await window.api.gitee.listIssues({
          repoPath: repo.path,
          repoId: repo.id,
          limit: 50,
          state: giteeFilter
        })
        return { repoId: repo.id, result }
      })
    )
      .then((results) => {
        if (stale) {
          return
        }
        const items: GiteeTaskItem[] = []
        const pullRequests: GiteePullRequestInfo[] = []
        const projects: GiteeProjectInfo[] = []
        const errors: string[] = []
        for (const { repoId, result } of results) {
          if (giteeMode === 'prs') {
            pullRequests.push(...result.items.map((item) => ({ ...item, repoId })))
          } else if (giteeMode === 'projects') {
            projects.push(...result.items.map((item) => ({ ...item, repoId })))
          } else {
            items.push(...result.items.map((item) => ({ ...item, repoId })))
          }
          if (result.error) {
            errors.push(result.error.message)
          }
        }
        items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        setGiteeItems(items)
        setGiteePullRequests(pullRequests)
        setGiteeProjects(projects)
        setGiteeError(errors.length > 0 ? errors[0] : null)
      })
      .catch((error: unknown) => {
        if (!stale) {
          setGiteeError(error instanceof Error ? error.message : String(error))
        }
      })
      .finally(() => {
        if (!stale) {
          setGiteeLoading(false)
        }
      })
    return () => {
      stale = true
    }
  }, [
    giteeMode,
    giteeFilter,
    giteeRefreshNonce,
    selectedRepos,
    selectedReposKey,
    setGiteeError,
    setGiteeItems,
    setGiteeLoading,
    setGiteePullRequests,
    setGiteeProjects,
    taskSource
  ])
  return model
}
export type TaskPageGiteeLoadingModel = ReturnType<typeof useTaskPageGiteeLoading>
