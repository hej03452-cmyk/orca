import { createRemoteRefProbeCache } from '../git/remote-ref-probe-cache'

export type GiteeRepoRef = {
  host: 'gitee.com'
  owner: string
  repo: string
  apiBaseUrl: string
  webBaseUrl: string
}

type LocalGitExecOptions = { wslDistro?: string; remoteUrl?: string }

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

export function getGiteeRepoRefFromRemoteUrl(remoteUrl: string | null | undefined): GiteeRepoRef | null {
  return remoteUrl?.trim() ? parseGiteeRepoRef(remoteUrl) : null
}

const repoRefProbeCache = createRemoteRefProbeCache(parseGiteeRepoRef)

export async function getGiteeRepoRefForRemote(
  repoPath: string,
  remoteName: string,
  connectionId?: string | null,
  localGitOptions: LocalGitExecOptions = {}
): Promise<GiteeRepoRef | null> {
  return repoRefProbeCache.get(repoPath, remoteName, connectionId, localGitOptions)
}

export function _resetGiteeRepoRefCache(): void {
  repoRefProbeCache.clear()
}

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
