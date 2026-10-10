import { ipcRenderer } from 'electron'
import type { GiteeApi } from './gitee-api'

export const giteeApi: GiteeApi = {
  connect: (args) => ipcRenderer.invoke('gitee:connect', args),
  disconnect: () => ipcRenderer.invoke('gitee:disconnect'),
  credentialStatus: () => ipcRenderer.invoke('gitee:credentialStatus'),
  updateIssue: (args) => ipcRenderer.invoke('gitee:updateIssue', args),
  addIssueComment: (args) => ipcRenderer.invoke('gitee:addIssueComment', args),
  createIssue: (args) => ipcRenderer.invoke('gitee:createIssue', args),
  listProjects: (args) => ipcRenderer.invoke('gitee:listProjects', args),
  issue: (args) => ipcRenderer.invoke('gitee:issue', args),
  listIssues: (args) => ipcRenderer.invoke('gitee:listIssues', args),
  listPullRequests: (args) => ipcRenderer.invoke('gitee:listPullRequests', args),
  pullRequest: (args) => ipcRenderer.invoke('gitee:pullRequest', args),
  updatePullRequest: (args) => ipcRenderer.invoke('gitee:updatePullRequest', args),
  createPullRequest: (args) => ipcRenderer.invoke('gitee:createPullRequest', args)
}
