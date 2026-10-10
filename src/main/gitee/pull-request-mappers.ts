import type { CheckStatus, PRMergeableState } from '../../shared/github/pull-request-types'

/** Gitee 拉取请求接口的原始响应结构。 */
export type RawGiteePullRequest = {
  number?: number
  title?: string
  state?: string | null
  html_url?: string | null
  updated_at?: string | null
  body?: string | null
  user?: { login?: string | null; name?: string | null } | null
  merged_at?: string | null
  draft?: boolean | null
  mergeable?: boolean | null
  head?: { ref?: string | null; sha?: string | null } | null
  base?: { ref?: string | null } | null
}

/** 任务页展示所需的 Gitee 拉取请求模型。 */
export type GiteePullRequestInfo = {
  number: number
  title: string
  state: 'open' | 'closed' | 'merged' | 'draft'
  url: string
  status: CheckStatus
  updatedAt: string
  mergeable: PRMergeableState
  headSha?: string
  body: string
  author: string | null
  headRef?: string
  baseRef?: string
}

/** Gitee 提交检查状态的原始结构。 */
export type RawGiteeCommitStatus = {
  state?: string | null
  status?: string | null
}

/** 将 Gitee 检查项汇总为 Orca 通用的检查状态。 */
export function deriveGiteeCommitStatus(statuses: RawGiteeCommitStatus[] | null): CheckStatus {
  if (!statuses || statuses.length === 0) {
    return 'neutral'
  }
  let pending = false
  for (const status of statuses) {
    switch ((status.state ?? status.status ?? '').trim().toLowerCase()) {
      case 'failure':
      case 'error':
      case 'failed':
        return 'failure'
      case 'pending':
      case 'running':
      case 'in_progress':
        pending = true
        break
    }
  }
  if (pending) {
    return 'pending'
  }
  return statuses.every((status) =>
    ['success', 'passed', 'ok'].includes((status.state ?? status.status ?? '').trim().toLowerCase())
  )
    ? 'success'
    : 'neutral'
}

/** 按 Gitee 的字段优先级计算拉取请求状态。 */
export function mapGiteePullRequestState(raw: RawGiteePullRequest): GiteePullRequestInfo['state'] {
  if (raw.merged_at) {
    return 'merged'
  }
  if (raw.state?.toLowerCase() === 'closed') {
    return 'closed'
  }
  if (raw.draft) {
    return 'draft'
  }
  return 'open'
}

/** 将单条 Gitee 拉取请求映射为任务页模型，缺少关键字段时返回 null。 */
export function mapGiteePullRequest(
  raw: RawGiteePullRequest,
  status: CheckStatus = 'neutral'
): GiteePullRequestInfo | null {
  if (typeof raw.number !== 'number' || !raw.title || !raw.html_url) {
    return null
  }
  const headSha = raw.head?.sha?.trim()
  const headRef = raw.head?.ref?.trim()
  const baseRef = raw.base?.ref?.trim()
  return {
    number: raw.number,
    title: raw.title,
    state: mapGiteePullRequestState(raw),
    url: raw.html_url,
    status,
    updatedAt: raw.updated_at ?? '',
    body: raw.body ?? '',
    author: raw.user?.login ?? raw.user?.name ?? null,
    ...(headRef ? { headRef } : {}),
    ...(baseRef ? { baseRef } : {}),
    mergeable:
      raw.mergeable === true ? 'MERGEABLE' : raw.mergeable === false ? 'CONFLICTING' : 'UNKNOWN',
    ...(headSha ? { headSha } : {})
  }
}
