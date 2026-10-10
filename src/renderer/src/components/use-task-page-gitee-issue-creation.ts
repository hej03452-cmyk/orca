import type { TaskPageGiteeLoadingModel } from './use-task-page-gitee-loading'
import { useCallback } from 'react'
import { toast } from 'sonner'
import type { GiteeTaskItem } from '../../../shared/gitee-issue-types'

export function useTaskPageGiteeIssueCreation(model: TaskPageGiteeLoadingModel) {
  const {
    giteeNewIssueTargetRepo,
    giteeNewIssueTitle,
    giteeNewIssueBody,
    giteeNewIssueSubmitting,
    setGiteeNewIssueSubmitting,
    setGiteeNewIssueOpen,
    setGiteeNewIssueTitle,
    setGiteeNewIssueBody,
    setGiteeRefreshNonce,
    setSelectedGiteeItem
  } = model
  const handleCreateGiteeIssue = useCallback(async (): Promise<void> => {
    if (!giteeNewIssueTargetRepo || !giteeNewIssueTitle.trim() || giteeNewIssueSubmitting) {
      return
    }
    setGiteeNewIssueSubmitting(true)
    try {
      const result = await window.api.gitee.createIssue({
        repoPath: giteeNewIssueTargetRepo.path,
        repoId: giteeNewIssueTargetRepo.id,
        title: giteeNewIssueTitle.trim(),
        body: giteeNewIssueBody
      })
      if (!result.ok || !result.number) {
        toast.error(result.error ?? '创建 Gitee 议题失败。')
        return
      }
      const item: GiteeTaskItem = result.issue
        ? { ...result.issue, repoId: giteeNewIssueTargetRepo.id }
        : {
            number: result.number,
            title: giteeNewIssueTitle.trim(),
            state: 'open',
            url: result.url ?? '',
            body: giteeNewIssueBody,
            updatedAt: new Date().toISOString(),
            author: null,
            labels: [],
            repoId: giteeNewIssueTargetRepo.id
          }
      setGiteeNewIssueOpen(false)
      setGiteeNewIssueTitle('')
      setGiteeNewIssueBody('')
      setGiteeRefreshNonce((value) => value + 1)
      setSelectedGiteeItem(item)
      toast.success(`已创建 Gitee 议题 #${result.number}`)
    } finally {
      setGiteeNewIssueSubmitting(false)
    }
  }, [
    giteeNewIssueBody,
    giteeNewIssueSubmitting,
    giteeNewIssueTargetRepo,
    giteeNewIssueTitle,
    setGiteeNewIssueBody,
    setGiteeNewIssueOpen,
    setGiteeNewIssueSubmitting,
    setGiteeNewIssueTitle,
    setGiteeRefreshNonce,
    setSelectedGiteeItem
  ])
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: this staged hook augments the task-page model with its creation handler.
  const nextModel = model as typeof model & { handleCreateGiteeIssue: typeof handleCreateGiteeIssue }
  nextModel.handleCreateGiteeIssue = handleCreateGiteeIssue
  return nextModel
}

export type TaskPageGiteeIssueCreationModel = ReturnType<typeof useTaskPageGiteeIssueCreation>
