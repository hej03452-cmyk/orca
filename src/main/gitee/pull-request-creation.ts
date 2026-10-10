import type { ExecutionHostId } from '../../shared/execution-host'
import type { HostedReviewExecutionOptions } from '../source-control/hosted-review-git-options'
import type { CreateHostedReviewInput, CreateHostedReviewResult } from '../../shared/hosted-review'
import { hostedReviewSshConnectionId } from '../source-control/hosted-review-execution-host'
import { getGiteeRepoRef } from './repository-ref'
import { getGiteePullRequestForBranch } from './client'
import { mapGiteePullRequest, type RawGiteePullRequest } from './pull-request-mappers'
import {
  normalizeHostedReviewBaseRef,
  normalizeHostedReviewHeadRef
} from '../../shared/hosted-review-refs'
import {
  requestHostedReviewJson,
  HostedReviewApiRequestError
} from '../source-control/hosted-review-api-request'
import { getConfiguredGiteeToken } from './credential-store'

function token(): string | null {
  return getConfiguredGiteeToken()
}
export function isGiteeReviewCreationAuthenticated(): boolean {
  return token() !== null
}
export async function createGiteePullRequest(
  repoPath: string,
  input: CreateHostedReviewInput,
  executionHostId: ExecutionHostId,
  options: HostedReviewExecutionOptions = {}
): Promise<CreateHostedReviewResult> {
  if (input.provider !== 'gitee') {
    return {
      ok: false,
      code: 'unsupported_provider',
      error: 'Creating reviews for this provider is not supported yet.'
    }
  }
  if (!token()) {
    return {
      ok: false,
      code: 'auth_required',
      error: '创建 Gitee 拉取请求需要先完成 Gitee 登录并授予仓库写入权限。'
    }
  }
  const repo = await getGiteeRepoRef(repoPath, hostedReviewSshConnectionId(executionHostId), {
    remoteUrl: options.remoteUrl
  })
  if (!repo) {
    return {
      ok: false,
      code: 'unsupported_provider',
      error: '当前工作区没有关联 Gitee 远程仓库，请检查仓库地址。'
    }
  }
  const base = normalizeHostedReviewBaseRef(input.base)
  const head = input.head ? normalizeHostedReviewHeadRef(input.head) : ''
  if (!base || !head || !input.title.trim() || base.toLowerCase() === head.toLowerCase()) {
    return {
      ok: false,
      code: 'validation',
      error: '创建拉取请求需要填写标题、目标分支和源分支，且两个分支不能相同。'
    }
  }
  const url = new URL(
    `${repo.apiBaseUrl}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/pulls`
  )
  url.searchParams.set('access_token', token()!)
  try {
    const raw = await requestHostedReviewJson<RawGiteePullRequest>(
      url,
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input.title.trim(), body: input.body ?? '', head, base })
      },
      60_000
    )
    const created = mapGiteePullRequest(raw)
    return created
      ? { ok: true, number: created.number, url: created.url }
      : {
          ok: false,
          code: 'unknown_completion',
          error: '拉取请求可能已经创建，正在刷新分支状态。'
        }
  } catch (error) {
    const status = error instanceof HostedReviewApiRequestError ? error.status : null
    if (status === 401 || status === 403) {
      return {
        ok: false,
        code: 'auth_required',
        error: 'Gitee 拒绝了创建拉取请求，请检查登录状态和仓库写入权限。'
      }
    }
    if (status === 409) {
      const existing = await getGiteePullRequestForBranch(
        repoPath,
        head,
        null,
        hostedReviewSshConnectionId(executionHostId)
      )
      return existing
        ? {
            ok: false,
            code: 'already_exists',
            error: '这个分支已经存在拉取请求。',
            existingReview: { number: existing.number, url: existing.url }
          }
        : {
            ok: false,
            code: 'already_exists',
            error: '这个分支已经存在拉取请求。'
          }
    }
    return {
      ok: false,
      code: 'unknown',
      error: 'Gitee 暂时无法创建拉取请求，请稍后重试。'
    }
  }
}
