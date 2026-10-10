import type { TaskPageGiteeLoadingModel } from './use-task-page-gitee-loading'
import { useCallback } from 'react'
import { toast } from 'sonner'

export function useTaskPageGiteePullRequestCreation(model: TaskPageGiteeLoadingModel) {
  const { giteeNewPullRequestTitle, giteeNewPullRequestBody, giteeNewPullRequestBase, giteeNewPullRequestHead, giteeNewPullRequestSubmitting, setGiteeNewPullRequestOpen, setGiteeNewPullRequestSubmitting, setGiteeNewPullRequestTitle, setGiteeNewPullRequestBody, setGiteeNewPullRequestHead, selectedRepos, setGiteeRefreshNonce } = model
  const handleCreateGiteePullRequest = useCallback(async () => {
    const repo = selectedRepos[0]
    if (!repo || !giteeNewPullRequestTitle.trim() || !giteeNewPullRequestBase.trim() || !giteeNewPullRequestHead.trim() || giteeNewPullRequestSubmitting) { return }
    setGiteeNewPullRequestSubmitting(true)
    try {
      const result = await window.api.gitee.createPullRequest({ repoPath: repo.path, repoId: repo.id, base: giteeNewPullRequestBase.trim(), head: giteeNewPullRequestHead.trim(), title: giteeNewPullRequestTitle.trim(), body: giteeNewPullRequestBody })
      if (!result.ok) { toast.error(result.error); return }
      setGiteeNewPullRequestOpen(false)
      setGiteeNewPullRequestTitle('')
      setGiteeNewPullRequestBody('')
      setGiteeNewPullRequestHead('')
      setGiteeRefreshNonce((value) => value + 1)
      toast.success(`已创建 Gitee 拉取请求 #${result.number}`)
    } finally { setGiteeNewPullRequestSubmitting(false) }
  }, [giteeNewPullRequestBase, giteeNewPullRequestBody, giteeNewPullRequestHead, giteeNewPullRequestSubmitting, giteeNewPullRequestTitle, selectedRepos, setGiteeNewPullRequestBody, setGiteeNewPullRequestHead, setGiteeNewPullRequestOpen, setGiteeNewPullRequestSubmitting, setGiteeNewPullRequestTitle, setGiteeRefreshNonce])
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: this staged hook augments the model with the handler consumed by the Gitee PR dialog.
  const nextModel = model as typeof model & { handleCreateGiteePullRequest: typeof handleCreateGiteePullRequest }
  nextModel.handleCreateGiteePullRequest = handleCreateGiteePullRequest
  return nextModel
}
