import type { GiteeIssueInfo, GiteeIssueComment } from '../../shared/gitee-issue-types'
export type { GiteeIssueInfo } from '../../shared/gitee-issue-types'

export type RawGiteeIssue = {
  number?: number | string
  title?: string
  state?: string | null
  html_url?: string | null
  body?: string | null
  updated_at?: string | null
  user?: { login?: string | null; name?: string | null } | null
  assignee?: { login?: string | null; name?: string | null } | null
  assignees?: { login?: string | null; name?: string | null }[] | null
  labels?: ({ name?: string | null } | string)[] | null
  // Gitee list responses sometimes return a numeric comment count here.
  comments?: RawGiteeIssueComment[] | number | string | null
  comment_count?: number | string | null
}

export type RawGiteeIssueComment = {
  id?: number | string
  body?: string | null
  created_at?: string | null
  html_url?: string | null
  user?: { login?: string | null; name?: string | null } | null
}

export function mapGiteeIssue(raw: RawGiteeIssue): GiteeIssueInfo | null {
  const number = raw.number == null ? '' : String(raw.number).trim()
  if (!number || !raw.title || !raw.html_url) {
    return null
  }
  return {
    number,
    title: raw.title,
    state: raw.state?.toLowerCase() === 'closed' ? 'closed' : 'open',
    url: raw.html_url,
    body: raw.body ?? '',
    updatedAt: raw.updated_at ?? '',
    author: raw.user?.login ?? raw.user?.name ?? null,
    assignee:
      raw.assignee?.login ??
      raw.assignee?.name ??
      raw.assignees?.[0]?.login ??
      raw.assignees?.[0]?.name ??
      null,
    labels: (raw.labels ?? [])
      .map((label) => (typeof label === 'string' ? label : (label.name ?? '')))
      .filter((label) => label.length > 0),
    comments: Array.isArray(raw.comments)
      ? raw.comments.map((comment): GiteeIssueComment => ({
          id: String(comment.id ?? ''),
          author: comment.user?.login ?? comment.user?.name ?? null,
          body: comment.body ?? '',
          createdAt: comment.created_at ?? '',
          url: comment.html_url ?? ''
        }))
      : undefined,
    commentCount:
      typeof raw.comments === 'number'
        ? raw.comments
        : typeof raw.comments === 'string' && /^\d+$/.test(raw.comments)
          ? Number(raw.comments)
          : typeof raw.comment_count === 'number'
            ? raw.comment_count
            : typeof raw.comment_count === 'string' && /^\d+$/.test(raw.comment_count)
              ? Number(raw.comment_count)
              : undefined
  }
}
