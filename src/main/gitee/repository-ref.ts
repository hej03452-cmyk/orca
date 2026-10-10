import { createRemoteRefProbeCache } from '../git/remote-ref-probe-cache'

/** 已解析的 Gitee 仓库信息，后续 API 请求都使用这个统一结构。 */
export type GiteeRepoRef = {
  host: 'gitee.com'
  owner: string
  repo: string
  apiBaseUrl: string
  webBaseUrl: string
}

type LocalGitExecOptions = { wslDistro?: string; remoteUrl?: string }

/** 从远程 URL 的路径部分提取“拥有者/仓库名”。 */
function parsePath(pathname: string): { owner: string; repo: string } | null {
  const parts = pathname
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
    .split('/')
    .filter(Boolean)
  if (parts.length < 2) {
    return null
  }
  const owner = decodeURIComponent(parts.at(-2) ?? '')
  const repo = decodeURIComponent(parts.at(-1) ?? '')
  return owner && repo ? { owner, repo } : null
}

/** 解析 HTTPS、SSH 和 SCP 格式的 Gitee 远程地址。 */
export function parseGiteeRepoRef(remoteUrl: string): GiteeRepoRef | null {
  const trimmed = remoteUrl.trim()
  let host: string | undefined
  let path: string | undefined
  const scp = !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed.match(/^(?:[^@/:]+@)?([^:\s/]+):([^\s]+)$/)
    : null
  if (scp) {
    host = scp[1]
    path = `/${scp[2]}`
  } else {
    try {
      const url = new URL(trimmed)
      host = url.hostname
      path = url.pathname
    } catch {
      return null
    }
  }
  if (host?.toLowerCase() !== 'gitee.com' || !path) {
    return null
  }
  const parsed = parsePath(path)
  if (!parsed) {
    return null
  }
  return {
    host: 'gitee.com',
    owner: parsed.owner,
    repo: parsed.repo,
    apiBaseUrl: 'https://gitee.com/api/v5',
    webBaseUrl: 'https://gitee.com'
  }
}

/** 在已有远程地址存在时直接解析，避免再次执行 Git 命令。 */
export function getGiteeRepoRefFromRemoteUrl(remoteUrl: string | null | undefined): GiteeRepoRef | null {
  return remoteUrl?.trim() ? parseGiteeRepoRef(remoteUrl) : null
}

const repoRefProbeCache = createRemoteRefProbeCache(parseGiteeRepoRef)

/** 从本地仓库远程配置中查询并缓存 Gitee 仓库信息。 */
export async function getGiteeRepoRefForRemote(
  repoPath: string,
  remoteName: string,
  connectionId?: string | null,
  localGitOptions: LocalGitExecOptions = {}
): Promise<GiteeRepoRef | null> {
  return repoRefProbeCache.get(repoPath, remoteName, connectionId, localGitOptions)
}

/** 测试或凭据变化后清空远程仓库解析缓存。 */
export function _resetGiteeRepoRefCache(): void {
  repoRefProbeCache.clear()
}

/** 优先使用调用方提供的远程地址，否则读取仓库的 origin。 */
export function getGiteeRepoRef(
  repoPath: string,
  connectionId?: string | null,
  localGitOptions: LocalGitExecOptions = {}
): Promise<GiteeRepoRef | null> {
  const resolved = localGitOptions.remoteUrl ? parseGiteeRepoRef(localGitOptions.remoteUrl) : null
  if (resolved) {
    return Promise.resolve(resolved)
  }
  return getGiteeRepoRefForRemote(repoPath, 'origin', connectionId, localGitOptions)
}
