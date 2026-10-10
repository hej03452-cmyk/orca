import type { GiteeIssueComment, GiteeIssueInfo } from '../../shared/gitee-issue-types'
import type { GiteePullRequestInfo } from '../../shared/gitee-pull-request-types'
import type { GiteeProjectInfo } from '../../shared/gitee-project-types'
import type { CreateHostedReviewResult } from '../../shared/hosted-review'
import type { GiteeConnectionStatus, GiteeConnectResult } from '../../shared/gitee-credentials'

export type GiteeIssueListResult = {
  items: GiteeIssueInfo[]
  error?: { type: 'auth' | 'not_found' | 'unknown'; message: string }
}

/** 渲染器可使用的 Gitee API 类型；令牌字段不会从主进程返回。 */
export type GiteeApi = {
  connect: (args: { token: string; baseUrl?: string | null }) => Promise<GiteeConnectResult>
  disconnect: () => Promise<void>
  credentialStatus: () => Promise<GiteeConnectionStatus>
  updateIssue: (args: {
    repoPath: string
    repoId?: string
    number: string
    updates: { title?: string; body?: string; state?: 'open' | 'closed' }
  }) => Promise<{ ok: boolean; error?: string }>
  addIssueComment: (args: {
    repoPath: string
    repoId?: string
    number: string
    body: string
  }) => Promise<{ ok: boolean; error?: string; comment?: GiteeIssueComment }>
  createIssue: (args: {
    repoPath: string
    repoId?: string
    title: string
    body?: string
  }) => Promise<{
    ok: boolean
    number?: string
    url?: string
    issue?: GiteeIssueInfo | null
    error?: string
  }>
  listProjects: (args: {
    repoPath: string
    repoId?: string
    limit?: number
  }) => Promise<GiteeProjectInfo[]>
  issue: (args: {
    repoPath: string
    repoId?: string
    number: string
  }) => Promise<GiteeIssueInfo | null>
  listIssues: (args: {
    repoPath: string
    repoId?: string
    limit?: number
    state?: 'open' | 'all' | 'progressing' | 'closed' | 'rejected'
  }) => Promise<GiteeIssueListResult>
  listPullRequests: (args: {
    repoPath: string
    repoId?: string
    limit?: number
  }) => Promise<GiteePullRequestInfo[]>
  pullRequest: (args: {
    repoPath: string
    repoId?: string
    number: number
  }) => Promise<GiteePullRequestInfo | null>
  updatePullRequest: (args: {
    repoPath: string
    repoId?: string
    number: number
    action: 'merge' | 'close'
  }) => Promise<{ ok: boolean; error?: string }>
  createPullRequest: (args: {
    repoPath: string
    repoId?: string
    executionHostId?: string
    base: string
    head: string
    title: string
    body?: string
  }) => Promise<CreateHostedReviewResult>
}
