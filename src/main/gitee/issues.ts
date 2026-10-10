import type { HostedReviewExecutionOptions } from '../source-control/hosted-review-git-options'
import { getHostedReviewLocalGitOptions } from '../source-control/hosted-review-git-options'
import { getGiteeRepoRef } from './repository-ref'
import { mapGiteeIssue, type GiteeIssueInfo, type RawGiteeIssue } from './issue-types'
import {
  HostedReviewApiRequestError,
  requestHostedReviewJson
} from '../source-control/hosted-review-api-request'
import { getConfiguredGiteeToken } from './credential-store'

export type GiteeIssueListResult = {
  items: GiteeIssueInfo[]
  error?: { type: 'auth' | 'not_found' | 'unknown'; message: string }
}

export async function listGiteeIssues(
  repoPath: string,
  limit = 20,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {},
  state: 'open' | 'all' | 'progressing' | 'closed' | 'rejected' = 'open'
): Promise<GiteeIssueListResult> {
  const repo = await getGiteeRepoRef(
    repoPath,
    connectionId,
    getHostedReviewLocalGitOptions(options)
  )
  if (!repo) {
    return {
      items: [],
      error: {
        type: 'not_found',
        message: '当前工作区没有关联可用的 Gitee 仓库，请检查远程仓库地址。'
      }
    }
  }
  try {
    const response = await fetch(
      `${repo.apiBaseUrl}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/issues?state=${state}&sort=updated&direction=desc&per_page=${Math.min(Math.max(limit, 1), 100)}${tokenQuery()}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
    )
    if (response.status === 401 || response.status === 403) {
      return {
        items: [],
        error: {
          type: 'auth',
          message: 'Gitee 拒绝了访问，请在设置中完成 Gitee 登录或配置访问令牌。'
        }
      }
    }
    if (!response.ok) {
      if (response.status === 404) {
        return {
          items: [],
          error: {
            type: 'auth',
            message:
              '找不到这个 Gitee 仓库。请检查仓库地址；如果仓库是私有的，请先完成 Gitee 登录并授予仓库访问权限。'
          }
        }
      }
      return {
        items: [],
        error: {
          type: 'unknown',
          message: `Gitee 暂时无法加载议题（错误代码 ${response.status}），请稍后重试。`
        }
      }
    }
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: the Gitee issue-list endpoint returns the documented issue array shape.
    const raw = (await response.json()) as RawGiteeIssue[]
    return {
      items: raw.map(mapGiteeIssue).filter((issue): issue is GiteeIssueInfo => issue !== null)
    }
  } catch {
    return {
      items: [],
      error: { type: 'unknown', message: '无法连接 Gitee，请检查网络连接后重试。' }
    }
  }
}

export async function getGiteeIssue(
  repoPath: string,
  number: string,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<GiteeIssueInfo | null> {
  const repo = await getGiteeRepoRef(
    repoPath,
    connectionId,
    getHostedReviewLocalGitOptions(options)
  )
  if (!repo) {
    return null
  }
  const response = await fetch(
    `${repo.apiBaseUrl}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/issues/${number}${tokenQuery(true)}`,
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
  ).catch(() => null)
  if (!response?.ok) {
    return null
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: the Gitee issue-detail endpoint returns the documented issue shape.
  const issue = mapGiteeIssue((await response.json()) as RawGiteeIssue)
  if (!issue) {
    return null
  }
  const commentsResponse = await fetch(
    `${repo.apiBaseUrl}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/issues/${number}/comments${tokenQuery(true)}`,
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
  ).catch(() => null)
  if (commentsResponse?.ok) {
    const payload: unknown = await commentsResponse.json().catch(() => [])
    const comments = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)
        ? payload.data
        : []
    issue.comments = comments.map(
      (comment: {
        id?: number | string
        body?: string
        created_at?: string
        html_url?: string
        user?: { login?: string; name?: string }
      }) => ({
        id: String(comment.id ?? ''),
        author: comment.user?.login ?? comment.user?.name ?? null,
        body: comment.body ?? '',
        createdAt: comment.created_at ?? '',
        url: comment.html_url ?? ''
      })
    )
    issue.commentCount = issue.comments.length
  }
  return issue
}

export async function updateGiteeIssue(
  repoPath: string,
  number: string,
  updates: { title?: string; body?: string; state?: 'open' | 'closed' },
  options: HostedReviewExecutionOptions = {}
): Promise<{ ok: boolean; error?: string }> {
  const repo = await getGiteeRepoRef(repoPath, null, getHostedReviewLocalGitOptions(options))
  if (!repo || !getConfiguredGiteeToken()) {
    return { ok: false, error: '更新 Gitee 议题需要先完成 Gitee 登录并授予仓库写入权限。' }
  }
  try {
    await requestHostedReviewJson(
      new URL(
        `${repo.apiBaseUrl}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/issues/${number}${tokenQuery(true)}`
      ),
      {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      },
      60_000
    )
    return { ok: true }
  } catch (error) {
    const status = error instanceof HostedReviewApiRequestError ? error.status : null
    return {
      ok: false,
      error: status ? `Gitee 操作失败（错误代码 ${status}），请检查权限后重试。` : 'Gitee 操作失败，请稍后重试。'
    }
  }
}

export async function addGiteeIssueComment(
  repoPath: string,
  number: string,
  body: string,
  options: HostedReviewExecutionOptions = {}
): Promise<{
  ok: boolean
  error?: string
  comment?: { id: string; author: string | null; body: string; createdAt: string; url: string }
}> {
  const repo = await getGiteeRepoRef(repoPath, null, getHostedReviewLocalGitOptions(options))
  if (!repo || !getConfiguredGiteeToken()) {
    return { ok: false, error: '发表评论需要先完成 Gitee 登录并授予仓库写入权限。' }
  }
  try {
    const comment = await requestHostedReviewJson<{
      id?: number | string
      body?: string
      created_at?: string
      html_url?: string
      user?: { login?: string; name?: string }
    }>(
      new URL(
        `${repo.apiBaseUrl}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/issues/${number}/comments${tokenQuery(true)}`
      ),
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      },
      60_000
    )
    return {
      ok: true,
      comment: {
        id: String(comment.id ?? ''),
        author: comment.user?.login ?? comment.user?.name ?? null,
        body: comment.body ?? body,
        createdAt: comment.created_at ?? new Date().toISOString(),
        url: comment.html_url ?? ''
      }
    }
  } catch (error) {
    const status = error instanceof HostedReviewApiRequestError ? error.status : null
    return {
      ok: false,
      error: status ? `发表评论失败（错误代码 ${status}），请检查权限后重试。` : '发表评论失败，请稍后重试。'
    }
  }
}

export type CreateGiteeIssueResult =
  | { ok: true; number: string; url: string; issue: GiteeIssueInfo | null }
  | { ok: false; error: string }

export async function createGiteeIssue(
  repoPath: string,
  input: { title: string; body?: string },
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<CreateGiteeIssueResult> {
  const repo = await getGiteeRepoRef(
    repoPath,
    connectionId,
    getHostedReviewLocalGitOptions(options)
  )
  const token = getConfiguredGiteeToken()
  if (!repo) {
    return { ok: false, error: '无法解析 Gitee 仓库。' }
  }
  if (!token) {
    return { ok: false, error: '创建 Gitee 议题需要先完成 Gitee 登录并授予仓库写入权限。' }
  }
  try {
    const response = await fetch(
      `${repo.apiBaseUrl}/repos/${encodeURIComponent(repo.owner)}/issues?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `token ${token}`
        },
        body: JSON.stringify({ repo: repo.repo, title: input.title, body: input.body ?? '' }),
        signal: AbortSignal.timeout(5000)
      }
    )
    if (!response.ok) {
      const detail = await readGiteeError(response)
      if (response.status === 404) {
        return {
          ok: false,
          error: `Gitee 创建议题失败：仓库不存在、议题功能未开启，或 Token 没有该仓库的议题写入权限。${detail}`
        }
      }
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: `Gitee 创建议题失败：Token 无效或没有议题写入权限。${detail}`
        }
      }
      return {
        ok: false,
        error: `Gitee 创建议题失败（错误代码 ${response.status}）。${detail ? ` ${detail}` : ''}`
      }
    }
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: Gitee returns the documented issue object for a successful create.
    const raw = (await response.json()) as RawGiteeIssue
    const issue = mapGiteeIssue(raw)
    if (!issue) {
      return { ok: false, error: 'Gitee 返回的议题数据无效。' }
    }
    return { ok: true, number: issue.number, url: issue.url, issue }
  } catch {
    return { ok: false, error: 'Gitee 创建议题失败，请检查网络连接后重试。' }
  }
}

async function readGiteeError(response: Response): Promise<string> {
  const body = await response.text().catch(() => '')
  if (!body) {
    return ''
  }
  try {
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: error payload is decoded only for its optional message fields.
    const parsed = JSON.parse(body) as { message?: unknown; error?: unknown }
    const message =
      typeof parsed.message === 'string'
        ? parsed.message
        : typeof parsed.error === 'string'
          ? parsed.error
          : ''
    return message ? `（${message}）` : ''
  } catch {
    return ''
  }
}

function tokenQuery(withQuestionMark = false): string {
  const token = getConfiguredGiteeToken()
  return token ? `${withQuestionMark ? '?' : '&'}access_token=${encodeURIComponent(token)}` : ''
}
