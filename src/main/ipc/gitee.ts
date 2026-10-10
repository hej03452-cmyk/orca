import { ipcMain } from 'electron'
import type { Store } from '../persistence'
import {
  addGiteeIssueComment,
  createGiteeIssue,
  getGiteeIssue,
  listGiteeIssues,
  updateGiteeIssue
} from '../gitee/issues'
import { listGiteeProjects, listGiteePullRequests, updateGiteePullRequest } from '../gitee/client'
import { createGiteePullRequest } from '../gitee/pull-request-creation'
import { assertRegisteredRepo } from './gitlab-repo-access'
import { getRepoExecutionHostId } from '../../shared/execution-host'
import {
  connectGitee,
  disconnectGitee,
  getGiteeConnectionStatus
} from '../gitee/credential-connection'
import { _resetPreflightCache } from './preflight'

export function registerGiteeHandlers(store: Store): void {
  ipcMain.handle('gitee:connect', async (_event, args: { token?: unknown; baseUrl?: unknown }) => {
    const result = await connectGitee(
      typeof args?.token === 'string' ? args.token : '',
      typeof args?.baseUrl === 'string' ? args.baseUrl : null
    )
    if (result.ok) {
      _resetPreflightCache()
    }
    return result
  })
  ipcMain.handle('gitee:disconnect', async () => {
    disconnectGitee()
    _resetPreflightCache()
  })
  ipcMain.handle('gitee:credentialStatus', async () => getGiteeConnectionStatus())
  ipcMain.handle(
    'gitee:updatePullRequest',
    async (
      _event,
      args: { repoPath: string; repoId?: string; number: number; action: 'merge' | 'close' }
    ) => {
      const repo = assertRegisteredRepo(args, store)
      return updateGiteePullRequest(repo.path, args.number, args.action, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
  ipcMain.handle(
    'gitee:pullRequest',
    async (_event, args: { repoPath: string; repoId?: string; number: number }) => {
      const repo = assertRegisteredRepo(args, store)
      const { getGiteePullRequest } = await import('../gitee/client')
      return getGiteePullRequest(repo.path, args.number, undefined, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
  ipcMain.handle(
    'gitee:createPullRequest',
    async (
      _event,
      args: {
        repoPath: string
        repoId?: string
        executionHostId?: string
        base: string
        head: string
        title: string
        body?: string
      }
    ) => {
      const repo = assertRegisteredRepo(args, store)
      return createGiteePullRequest(
        repo.path,
        { provider: 'gitee', base: args.base, head: args.head, title: args.title, body: args.body },
        getRepoExecutionHostId(repo),
        { remoteUrl: repo.gitRemoteIdentity?.remoteUrl }
      )
    }
  )
  ipcMain.handle(
    'gitee:listProjects',
    async (
      _event,
      args: {
        repoPath: string
        repoId?: string
        limit?: number
        state?: 'open' | 'all' | 'progressing' | 'closed' | 'rejected'
      }
    ) => {
      const repo = assertRegisteredRepo(args, store)
      return listGiteeProjects(repo.path, args.limit ?? 50, undefined, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
  ipcMain.handle(
    'gitee:listPullRequests',
    async (
      _event,
      args: { repoPath: string; repoId?: string; limit?: number; state?: 'open' | 'all' }
    ) => {
      const repo = assertRegisteredRepo(args, store)
      return listGiteePullRequests(repo.path, args.limit ?? 50, undefined, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
  ipcMain.handle(
    'gitee:updateIssue',
    async (
      _event,
      args: {
        repoPath: string
        repoId?: string
        number: string
        updates: { title?: string; body?: string; state?: 'open' | 'closed' }
      }
    ) => {
      const repo = assertRegisteredRepo(args, store)
      return updateGiteeIssue(repo.path, args.number, args.updates, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
  ipcMain.handle(
    'gitee:addIssueComment',
    async (_event, args: { repoPath: string; repoId?: string; number: string; body: string }) => {
      const repo = assertRegisteredRepo(args, store)
      return addGiteeIssueComment(repo.path, args.number, args.body, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
  ipcMain.handle(
    'gitee:issue',
    async (_event, args: { repoPath: string; repoId?: string; number: string }) => {
      const repo = assertRegisteredRepo(args, store)
      return getGiteeIssue(repo.path, args.number, undefined, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
  ipcMain.handle(
    'gitee:listIssues',
    async (
      _event,
      args: { repoPath: string; repoId?: string; limit?: number; state?: 'open' | 'all' }
    ) => {
      const repo = assertRegisteredRepo(args, store)
      return listGiteeIssues(
        repo.path,
        args.limit ?? 20,
        undefined,
        { remoteUrl: repo.gitRemoteIdentity?.remoteUrl },
        args.state ?? 'open'
      )
    }
  )
  ipcMain.handle(
    'gitee:createIssue',
    async (_event, args: { repoPath: string; repoId?: string; title: string; body?: string }) => {
      const repo = assertRegisteredRepo(args, store)
      return createGiteeIssue(repo.path, { title: args.title, body: args.body }, undefined, {
        remoteUrl: repo.gitRemoteIdentity?.remoteUrl
      })
    }
  )
}
