import type { HostedReviewExecutionOptions } from '../source-control/hosted-review-git-options'
import { getHostedReviewLocalGitOptions } from '../source-control/hosted-review-git-options'
import { getGiteeRepoRef, type GiteeRepoRef } from './repository-ref'
import {
  deriveGiteeCommitStatus,
  mapGiteePullRequest,
  type GiteePullRequestInfo,
  type RawGiteeCommitStatus,
  type RawGiteePullRequest
} from './pull-request-mappers'
import { cancelUnreadResponseBody } from '../lib/unread-response-body'
import type { GiteePullRequestInfo as SharedGiteePullRequestInfo } from '../../shared/gitee-pull-request-types'
import type { GiteeProjectInfo } from '../../shared/gitee-project-types'
import {
  requestHostedReviewJson,
  HostedReviewApiRequestError
} from '../source-control/hosted-review-api-request'
import { getConfiguredGiteeToken, getStoredGiteeMetadata } from './credential-store'

const REQUEST_TIMEOUT_MS = 5000
type GiteeAuthConfig = { apiBaseUrl: string; token: string | null }
export type GiteeAuthStatus = {
  configured: boolean
  authenticated: boolean
  account: string | null
  baseUrl: string
  tokenConfigured: boolean
}

function envValue(name: string): string | null {
  const value = process.env[name]?.trim() ?? ''
  return value || null
}
function getAuthConfig(): GiteeAuthConfig {
  return {
    apiBaseUrl: (
      getStoredGiteeMetadata()?.baseUrl ??
      envValue('ORCA_GITEE_API_BASE_URL') ??
      'https://gitee.com/api/v5'
    ).replace(/\/+$/, ''),
    token: getConfiguredGiteeToken()
  }
}
function apiUrl(path: string, params?: Record<string, string | number>): URL {
  const url = new URL(`${getAuthConfig().apiBaseUrl}${path}`)
  const token = getAuthConfig().token
  if (token) {
    url.searchParams.set('access_token', token)
  }
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, String(value))
  }
  return url
}
async function requestJson<T>(
  path: string,
  params?: Record<string, string | number>,
  throwOnFailure = false
): Promise<T | null> {
  try {
    const response = await fetch(apiUrl(path, params), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
    if (!response.ok) {
      await cancelUnreadResponseBody(response)
      if (throwOnFailure) {
        throw new Error(`Gitee 请求失败（错误代码 ${response.status}），请稍后重试。`)
      }
      return null
    }
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: Gitee endpoints are decoded into the caller's declared response shape.
    return (await response.json()) as T
  } catch (error) {
    if (throwOnFailure) {
      throw error
    }
    return null
  }
}
async function getCommitStatus(
  repo: GiteeRepoRef,
  sha: string | undefined
): Promise<ReturnType<typeof deriveGiteeCommitStatus>> {
  if (!sha) {
    return 'neutral'
  }
  const statuses = await requestJson<RawGiteeCommitStatus[]>(
    `/repos/${encodedRepoPath(repo)}/commits/${encodeURIComponent(sha)}/statuses`,
    { per_page: 100 }
  )
  return deriveGiteeCommitStatus(statuses)
}
function encodedRepoPath(repo: GiteeRepoRef): string {
  return `${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`
}
function matchesBranch(raw: RawGiteePullRequest, branch: string): boolean {
  return raw.head?.ref?.trim() === branch
}

export async function getGiteeAuthStatus(): Promise<GiteeAuthStatus> {
  const config = getAuthConfig()
  if (!config.token) {
    return {
      configured: false,
      authenticated: false,
      account: null,
      baseUrl: config.apiBaseUrl,
      tokenConfigured: false
    }
  }
  const response = await fetch(
    new URL(`${config.apiBaseUrl}/user?access_token=${encodeURIComponent(config.token)}`),
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) }
  ).catch(() => null)
  if (!response?.ok) {
    if (response) {
      await cancelUnreadResponseBody(response)
    }
    return {
      configured: true,
      authenticated: false,
      account: null,
      baseUrl: config.apiBaseUrl,
      tokenConfigured: true
    }
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: the authenticated-user endpoint is narrowed to its documented optional fields.
  const user = (await response.json()) as { login?: string; name?: string }
  return {
    configured: true,
    authenticated: true,
    account: user.login ?? user.name ?? null,
    baseUrl: config.apiBaseUrl,
    tokenConfigured: true
  }
}

export async function getGiteePullRequest(
  repoPath: string,
  number: number,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<GiteePullRequestInfo | null> {
  const repo = await getGiteeRepoRef(
    repoPath,
    connectionId,
    getHostedReviewLocalGitOptions(options)
  )
  if (!repo) {
    return null
  }
  const raw = await requestJson<RawGiteePullRequest>(
    `/repos/${encodedRepoPath(repo)}/pulls/${number}`
  )
  return raw ? mapGiteePullRequest(raw, await getCommitStatus(repo, raw.head?.sha?.trim())) : null
}

export async function listGiteePullRequests(
  repoPath: string,
  limit = 50,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<SharedGiteePullRequestInfo[]> {
  const repo = await getGiteeRepoRef(
    repoPath,
    connectionId,
    getHostedReviewLocalGitOptions(options)
  )
  if (!repo) {
    return []
  }
  const raw = await requestJson<RawGiteePullRequest[]>(`/repos/${encodedRepoPath(repo)}/pulls`, {
    state: 'all',
    page: 1,
    per_page: Math.min(Math.max(limit, 1), 100)
  })
  return (raw ?? [])
    .map((item) => mapGiteePullRequest(item, 'neutral'))
    .filter((item): item is GiteePullRequestInfo => item !== null)
}

export async function updateGiteePullRequest(
  repoPath: string,
  number: number,
  action: 'merge' | 'close',
  options: HostedReviewExecutionOptions = {}
): Promise<{ ok: boolean; error?: string }> {
  const repo = await getGiteeRepoRef(repoPath, null, getHostedReviewLocalGitOptions(options))
  const accessToken = getConfiguredGiteeToken()
  if (!repo || !accessToken) {
    return { ok: false, error: '请先在设置中连接 Gitee，并确认当前仓库地址有效。' }
  }
  const endpoint =
    action === 'merge'
      ? `/repos/${encodedRepoPath(repo)}/pulls/${number}/merge`
      : `/repos/${encodedRepoPath(repo)}/pulls/${number}`
  try {
    const url = apiUrl(endpoint)
    await requestHostedReviewJson(
      url,
      {
        method: action === 'merge' ? 'PUT' : 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'merge' ? { merge_method: 'merge' } : { state: 'closed' })
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

export async function listGiteeProjects(
  repoPath: string,
  limit = 50,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<GiteeProjectInfo[]> {
  const repo = await getGiteeRepoRef(
    repoPath,
    connectionId,
    getHostedReviewLocalGitOptions(options)
  )
  if (!repo) {
    return []
  }
  const params = { page: 1, per_page: Math.min(Math.max(limit, 1), 100) }
  const raw = await requestJson<Record<string, unknown>[]>(
    `/repos/${encodedRepoPath(repo)}/projects`,
    params
  )
  if (raw) {
    return raw.flatMap((item) => {
      const id = String(item.id ?? item.number ?? '')
      const name = String(item.name ?? item.title ?? '')
      if (!id || !name) {
        return []
      }
      return [
        {
          id,
          name,
          description: String(item.description ?? ''),
          state: String(item.state ?? 'open'),
          url: String(
            item.html_url ?? item.url ?? `${repo.webBaseUrl}/${repo.owner}/${repo.repo}/projects`
          ),
          updatedAt: String(item.updated_at ?? item.updatedAt ?? '')
        }
      ]
    })
  }
  // Gitee installations without the projects endpoint still expose milestones; present them in the same project view.
  const milestones = await requestJson<Record<string, unknown>[]>(
    `/repos/${encodedRepoPath(repo)}/milestones`,
    params
  )
  return (milestones ?? []).flatMap((item) => {
    const id = String(item.id ?? '')
    const name = String(item.title ?? item.name ?? '')
    if (!id || !name) {
      return []
    }
    return [
      {
        id,
        name,
        description: String(item.description ?? ''),
        state: String(item.state ?? 'open'),
        url: `${repo.webBaseUrl}/${repo.owner}/${repo.repo}/milestones/${id}`,
        updatedAt: String(item.updated_at ?? '')
      }
    ]
  })
}

export async function getGiteePullRequestForBranch(
  repoPath: string,
  branch: string,
  linkedNumber?: number | null,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {},
  throwOnFailure = false
): Promise<GiteePullRequestInfo | null> {
  const repo = await getGiteeRepoRef(
    repoPath,
    connectionId,
    getHostedReviewLocalGitOptions(options)
  )
  if (!repo) {
    return null
  }
  const branchName = branch.replace(/^refs\/heads\//, '')
  const pages = await Promise.all(
    [1, 2, 3, 4, 5].map((page) =>
      requestJson<RawGiteePullRequest[]>(
        `/repos/${encodedRepoPath(repo)}/pulls`,
        { state: 'all', page, per_page: 100 },
        throwOnFailure
      )
    )
  )
  const raw = pages.flatMap((page) => page ?? []).find((item) => matchesBranch(item, branchName))
  if (raw) {
    return mapGiteePullRequest(raw, await getCommitStatus(repo, raw.head?.sha?.trim()))
  }
  return linkedNumber == null
    ? null
    : getGiteePullRequest(repoPath, linkedNumber, connectionId, options)
}

export function getGiteePullRequestForBranchOrThrow(
  repoPath: string,
  branch: string,
  linkedNumber?: number | null,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<GiteePullRequestInfo | null> {
  return getGiteePullRequestForBranch(repoPath, branch, linkedNumber, connectionId, options, true)
}

export function getGiteeRepoSlug(
  repoPath: string,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<GiteeRepoRef | null> {
  return getGiteeRepoRef(repoPath, connectionId, getHostedReviewLocalGitOptions(options))
}
