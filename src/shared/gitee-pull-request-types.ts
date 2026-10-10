/** Orca 统一使用的 Gitee 拉取请求数据。 */
export type GiteePullRequestInfo = {
  number: number
  title: string
  state: 'open' | 'closed' | 'merged' | 'draft'
  url: string
  body: string
  updatedAt: string
  author: string | null
  status?: 'success' | 'failure' | 'pending' | 'neutral'
  mergeable?: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN'
  headSha?: string
  headRef?: string
  baseRef?: string
  repoId?: string
}
