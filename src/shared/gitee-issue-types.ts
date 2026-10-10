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

export type GiteeIssueComment = {
  id: string
  author: string | null
  body: string
  createdAt: string
  url: string
}

export type GiteeTaskItem = GiteeIssueInfo & {
  repoId: string
  kind?: 'issue' | 'pr'
  prState?: 'open' | 'closed' | 'merged' | 'draft'
  prStatus?: 'success' | 'failure' | 'pending' | 'neutral'
  prMergeable?: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN'
  headRef?: string
  baseRef?: string
}
