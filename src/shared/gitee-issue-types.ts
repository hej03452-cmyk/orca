/** Orca 统一使用的 Gitee Issue 数据。 */
export type GiteeIssueInfo = {
  number: string
  title: string
  state: 'open' | 'closed'
  url: string
  body: string
  updatedAt: string
  author: string | null
  assignee?: string | null
  labels: string[]
  comments?: GiteeIssueComment[]
  commentCount?: number
}

/** Issue 评论的最小展示模型。 */
export type GiteeIssueComment = {
  id: string
  author: string | null
  body: string
  createdAt: string
  url: string
}

/** 任务页同时承载 Issue 和 PR 时使用的联合模型。 */
export type GiteeTaskItem = GiteeIssueInfo & {
  repoId: string
  kind?: 'issue' | 'pr'
  prState?: 'open' | 'closed' | 'merged' | 'draft'
  prStatus?: 'success' | 'failure' | 'pending' | 'neutral'
  prMergeable?: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN'
  headRef?: string
  baseRef?: string
}
