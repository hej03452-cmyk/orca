import type { TaskPageSourceAvailabilityModel } from './use-task-page-source-availability'
import { useRef, useState, useEffect, useMemo } from 'react'
import { resolveVisibleTaskProvider } from '../../../shared/task-providers'
import type { GitLabTaskFilter, GitLabIssueFilter } from '@/components/task-page-localized-options'
import type { GitLabWorkItem, GitLabTodo } from '../../../shared/gitlab-types'
import { getRepoBackedTaskEmptyState } from '@/components/task-page-empty-state'
import { isGitLabIssueFilter, isGitLabMRFilter } from './task-page-source-context'
import type { GiteeTaskItem } from '../../../shared/gitee-issue-types'
import type { GiteePullRequestInfo } from '../../../shared/gitee-pull-request-types'
import type { GiteeProjectInfo } from '../../../shared/gitee-project-types'

/** 保存任务页的 Gitee 列表、详情和新建表单状态，并向后续 hooks 暴露统一模型。 */
export function useTaskPageProviderState(model: TaskPageSourceAvailabilityModel) {
  const {
    settings,
    pageData,
    selectedRepos,
    visibleTaskProviders,
    preferredTaskSource,
    taskSource,
    setTaskSource
  } = model
  const taskSourceManuallyChangedRef = useRef(false)
  const lastPageTaskSourceRef = useRef(pageData.taskSource)
  const taskResumeAppliedRef = useRef(false)
  const githubSearchPersistReadyRef = useRef(false)
  const linearSearchPersistReadyRef = useRef(false)
  const linearViewPersistReadyRef = useRef(false)
  const jiraSearchPersistReadyRef = useRef(false)
  const [taskResumeApplied, setTaskResumeApplied] = useState(false)

  // Why: useState only inits once, so sync taskSource from the store when a sidebar source-icon click changes pageData.taskSource.
  useEffect(() => {
    const pageTaskSourceChanged = lastPageTaskSourceRef.current !== pageData.taskSource
    lastPageTaskSourceRef.current = pageData.taskSource
    if (pageData.taskSource) {
      if (pageTaskSourceChanged) {
        taskSourceManuallyChangedRef.current = false
      } else if (taskSourceManuallyChangedRef.current) {
        return
      }
      setTaskSource(resolveVisibleTaskProvider(pageData.taskSource, visibleTaskProviders))
    }
  }, [pageData.taskSource, visibleTaskProviders, setTaskSource])
  useEffect(() => {
    if (taskSourceManuallyChangedRef.current) {
      return
    }
    // Why: GitLab/Linear availability hydrates after mount; restore the saved default once its provider check proves it can be shown.
    if (visibleTaskProviders.includes(preferredTaskSource) && taskSource !== preferredTaskSource) {
      setTaskSource(preferredTaskSource)
    }
  }, [preferredTaskSource, taskSource, visibleTaskProviders, setTaskSource])
  useEffect(() => {
    if (!visibleTaskProviders.includes(taskSource)) {
      setTaskSource(resolveVisibleTaskProvider(settings?.defaultTaskSource, visibleTaskProviders))
    }
  }, [settings?.defaultTaskSource, taskSource, visibleTaskProviders, setTaskSource])

  // Why: Project mode is a GitHub sub-tab — visible on the GitHub source, but actual entry is gated on a non-null activeProject.
  const projectModeVisible = taskSource === 'github'
  const [githubMode, setGithubMode] = useState<'items' | 'project'>('items')

  // ── GitLab task-source state ──────────────────────────────────────
  // Why: parallel to Linear's slim per-source state — skips workItemsCache and cross-repo aggregation; fetches directly via window.api.gl for the primary repo.
  const [gitlabFilter, setGitlabFilter] = useState<GitLabTaskFilter | GitLabIssueFilter>('opened')
  const [gitlabItems, setGitlabItems] = useState<GitLabWorkItem[]>([])
  const [gitlabLoading, setGitlabLoading] = useState(false)
  const [gitlabError, setGitlabError] = useState<string | null>(null)
  const [gitlabRefreshNonce, setGitlabRefreshNonce] = useState(0)
  // Why: separate from gitlabItems so the dialog target survives a list refresh that removes the item from the visible filter (e.g. closing an MR).
  const [gitlabDialogItem, setGitlabDialogItem] = useState<GitLabWorkItem | null>(null)
  // Gitee 的三种模式共用刷新节奏，但分别保存列表，切换模式时不会丢失数据。
  const [giteeItems, setGiteeItems] = useState<GiteeTaskItem[]>([])
  const [giteeLoading, setGiteeLoading] = useState(false)
  const [giteeError, setGiteeError] = useState<string | null>(null)
  const [selectedGiteeItem, setSelectedGiteeItem] = useState<GiteeTaskItem | null>(null)
  const [giteeMode, setGiteeMode] = useState<'issues' | 'prs' | 'projects'>('issues')
  const [giteePullRequests, setGiteePullRequests] = useState<GiteePullRequestInfo[]>([])
  const [giteeRefreshNonce, setGiteeRefreshNonce] = useState(0)
  const [giteeProjects, setGiteeProjects] = useState<GiteeProjectInfo[]>([])
  const [giteeFilter, setGiteeFilter] = useState<'open' | 'all' | 'progressing' | 'closed' | 'rejected'>('open')
  const [giteeSearch, setGiteeSearch] = useState('')
  const [giteeNewIssueOpen, setGiteeNewIssueOpen] = useState(false)
  const [giteeNewIssueTitle, setGiteeNewIssueTitle] = useState('')
  const [giteeNewIssueBody, setGiteeNewIssueBody] = useState('')
  const [giteeNewIssueSubmitting, setGiteeNewIssueSubmitting] = useState(false)
  const [giteeNewIssueRepoId, setGiteeNewIssueRepoId] = useState<string | null>(null)
  const [giteeNewPullRequestOpen, setGiteeNewPullRequestOpen] = useState(false)
  const [giteeNewPullRequestTitle, setGiteeNewPullRequestTitle] = useState('')
  const [giteeNewPullRequestBody, setGiteeNewPullRequestBody] = useState('')
  const [giteeNewPullRequestBase, setGiteeNewPullRequestBase] = useState('main')
  const [giteeNewPullRequestHead, setGiteeNewPullRequestHead] = useState('')
  const [giteeNewPullRequestSubmitting, setGiteeNewPullRequestSubmitting] = useState(false)
  const giteeNewIssueTargetRepo = useMemo(
    () => selectedRepos.find((repo) => repo.id === giteeNewIssueRepoId) ?? selectedRepos[0] ?? null,
    [giteeNewIssueRepoId, selectedRepos]
  )

  // Why: GitLab tab has two sub-views — the project MR/issue list and the user's cross-project Todos (a separate stream).
  const [gitlabView, setGitlabView] = useState<'issues' | 'mrs' | 'todos'>('mrs')
  const [gitlabTodos, setGitlabTodos] = useState<GitLabTodo[]>([])
  const [gitlabTodosLoading, setGitlabTodosLoading] = useState(false)
  const gitlabEmptyState = useMemo(
    () =>
      getRepoBackedTaskEmptyState({
        provider: 'gitlab',
        selectedRepoCount: selectedRepos.length,
        gitlabView
      }),
    [gitlabView, selectedRepos.length]
  )
  const gitlabFilterIsValid =
    gitlabView === 'issues'
      ? isGitLabIssueFilter(gitlabFilter)
      : gitlabView === 'mrs'
        ? isGitLabMRFilter(gitlabFilter)
        : true
  const activeGitlabFilter = gitlabFilterIsValid ? gitlabFilter : 'opened'
  // Why: Issues and MRs expose different filter sets; repair before commit so fetch effects never run glab with a stale filter from the other view.
  if (!gitlabFilterIsValid) {
    setGitlabFilter('opened')
  }
  const displayedGitLabItems = useMemo(() => {
    if (gitlabView === 'issues') {
      return gitlabItems.filter((item) => item.type === 'issue')
    }
    if (gitlabView === 'mrs') {
      return gitlabItems.filter((item) => item.type === 'mr')
    }
    return gitlabItems
  }, [gitlabItems, gitlabView])
  // SAFETY: this staged hook augments the previous model with the state created above.
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: staged hook model is augmented with the state fields declared below.
  const nextModel = model as typeof model & {
    taskSourceManuallyChangedRef: typeof taskSourceManuallyChangedRef
    lastPageTaskSourceRef: typeof lastPageTaskSourceRef
    taskResumeAppliedRef: typeof taskResumeAppliedRef
    githubSearchPersistReadyRef: typeof githubSearchPersistReadyRef
    linearSearchPersistReadyRef: typeof linearSearchPersistReadyRef
    linearViewPersistReadyRef: typeof linearViewPersistReadyRef
    jiraSearchPersistReadyRef: typeof jiraSearchPersistReadyRef
    taskResumeApplied: typeof taskResumeApplied
    setTaskResumeApplied: typeof setTaskResumeApplied
    projectModeVisible: typeof projectModeVisible
    githubMode: typeof githubMode
    setGithubMode: typeof setGithubMode
    gitlabFilter: typeof gitlabFilter
    setGitlabFilter: typeof setGitlabFilter
    gitlabItems: typeof gitlabItems
    setGitlabItems: typeof setGitlabItems
    gitlabLoading: typeof gitlabLoading
    setGitlabLoading: typeof setGitlabLoading
    gitlabError: typeof gitlabError
    setGitlabError: typeof setGitlabError
    gitlabRefreshNonce: typeof gitlabRefreshNonce
    setGitlabRefreshNonce: typeof setGitlabRefreshNonce
    gitlabDialogItem: typeof gitlabDialogItem
    setGitlabDialogItem: typeof setGitlabDialogItem
    gitlabView: typeof gitlabView
    setGitlabView: typeof setGitlabView
    gitlabTodos: typeof gitlabTodos
    setGitlabTodos: typeof setGitlabTodos
    gitlabTodosLoading: typeof gitlabTodosLoading
    setGitlabTodosLoading: typeof setGitlabTodosLoading
    gitlabEmptyState: typeof gitlabEmptyState
    gitlabFilterIsValid: typeof gitlabFilterIsValid
    activeGitlabFilter: typeof activeGitlabFilter
    displayedGitLabItems: typeof displayedGitLabItems
    giteeItems: typeof giteeItems
    setGiteeItems: typeof setGiteeItems
    giteeLoading: typeof giteeLoading
    setGiteeLoading: typeof setGiteeLoading
    giteeError: typeof giteeError
    setGiteeError: typeof setGiteeError
    selectedGiteeItem: typeof selectedGiteeItem
    setSelectedGiteeItem: typeof setSelectedGiteeItem
    giteeMode: typeof giteeMode
    setGiteeMode: typeof setGiteeMode
    giteePullRequests: typeof giteePullRequests
    setGiteePullRequests: typeof setGiteePullRequests
    giteeRefreshNonce: typeof giteeRefreshNonce
    setGiteeRefreshNonce: typeof setGiteeRefreshNonce
    giteeProjects: typeof giteeProjects
    setGiteeProjects: typeof setGiteeProjects
    giteeFilter: typeof giteeFilter
    setGiteeFilter: typeof setGiteeFilter
    giteeSearch: typeof giteeSearch
    setGiteeSearch: typeof setGiteeSearch
    giteeNewIssueOpen: typeof giteeNewIssueOpen
    setGiteeNewIssueOpen: typeof setGiteeNewIssueOpen
    giteeNewIssueTitle: typeof giteeNewIssueTitle
    setGiteeNewIssueTitle: typeof setGiteeNewIssueTitle
    giteeNewIssueBody: typeof giteeNewIssueBody
    setGiteeNewIssueBody: typeof setGiteeNewIssueBody
    giteeNewIssueSubmitting: typeof giteeNewIssueSubmitting
    setGiteeNewIssueSubmitting: typeof setGiteeNewIssueSubmitting
    giteeNewIssueRepoId: typeof giteeNewIssueRepoId
    setGiteeNewIssueRepoId: typeof setGiteeNewIssueRepoId
    giteeNewIssueTargetRepo: typeof giteeNewIssueTargetRepo
    giteeNewPullRequestOpen: typeof giteeNewPullRequestOpen
    setGiteeNewPullRequestOpen: typeof setGiteeNewPullRequestOpen
    giteeNewPullRequestTitle: typeof giteeNewPullRequestTitle
    setGiteeNewPullRequestTitle: typeof setGiteeNewPullRequestTitle
    giteeNewPullRequestBody: typeof giteeNewPullRequestBody
    setGiteeNewPullRequestBody: typeof setGiteeNewPullRequestBody
    giteeNewPullRequestBase: typeof giteeNewPullRequestBase
    setGiteeNewPullRequestBase: typeof setGiteeNewPullRequestBase
    giteeNewPullRequestHead: typeof giteeNewPullRequestHead
    setGiteeNewPullRequestHead: typeof setGiteeNewPullRequestHead
    giteeNewPullRequestSubmitting: typeof giteeNewPullRequestSubmitting
    setGiteeNewPullRequestSubmitting: typeof setGiteeNewPullRequestSubmitting
  }
  nextModel.taskSourceManuallyChangedRef = taskSourceManuallyChangedRef
  nextModel.lastPageTaskSourceRef = lastPageTaskSourceRef
  nextModel.taskResumeAppliedRef = taskResumeAppliedRef
  nextModel.githubSearchPersistReadyRef = githubSearchPersistReadyRef
  nextModel.linearSearchPersistReadyRef = linearSearchPersistReadyRef
  nextModel.linearViewPersistReadyRef = linearViewPersistReadyRef
  nextModel.jiraSearchPersistReadyRef = jiraSearchPersistReadyRef
  nextModel.taskResumeApplied = taskResumeApplied
  nextModel.setTaskResumeApplied = setTaskResumeApplied
  nextModel.projectModeVisible = projectModeVisible
  nextModel.githubMode = githubMode
  nextModel.setGithubMode = setGithubMode
  nextModel.gitlabFilter = gitlabFilter
  nextModel.setGitlabFilter = setGitlabFilter
  nextModel.gitlabItems = gitlabItems
  nextModel.setGitlabItems = setGitlabItems
  nextModel.gitlabLoading = gitlabLoading
  nextModel.setGitlabLoading = setGitlabLoading
  nextModel.gitlabError = gitlabError
  nextModel.setGitlabError = setGitlabError
  nextModel.gitlabRefreshNonce = gitlabRefreshNonce
  nextModel.setGitlabRefreshNonce = setGitlabRefreshNonce
  nextModel.gitlabDialogItem = gitlabDialogItem
  nextModel.setGitlabDialogItem = setGitlabDialogItem
  nextModel.gitlabView = gitlabView
  nextModel.setGitlabView = setGitlabView
  nextModel.gitlabTodos = gitlabTodos
  nextModel.setGitlabTodos = setGitlabTodos
  nextModel.gitlabTodosLoading = gitlabTodosLoading
  nextModel.setGitlabTodosLoading = setGitlabTodosLoading
  nextModel.gitlabEmptyState = gitlabEmptyState
  nextModel.gitlabFilterIsValid = gitlabFilterIsValid
  nextModel.activeGitlabFilter = activeGitlabFilter
  nextModel.displayedGitLabItems = displayedGitLabItems
  nextModel.giteeItems = giteeItems
  nextModel.setGiteeItems = setGiteeItems
  nextModel.giteeLoading = giteeLoading
  nextModel.setGiteeLoading = setGiteeLoading
  nextModel.giteeError = giteeError
  nextModel.setGiteeError = setGiteeError
  nextModel.selectedGiteeItem = selectedGiteeItem
  nextModel.setSelectedGiteeItem = setSelectedGiteeItem
  nextModel.giteeMode = giteeMode
  nextModel.setGiteeMode = setGiteeMode
  nextModel.giteePullRequests = giteePullRequests
  nextModel.setGiteePullRequests = setGiteePullRequests
  nextModel.giteeRefreshNonce = giteeRefreshNonce
  nextModel.setGiteeRefreshNonce = setGiteeRefreshNonce
  nextModel.giteeProjects = giteeProjects
  nextModel.setGiteeProjects = setGiteeProjects
  nextModel.giteeFilter = giteeFilter
  nextModel.setGiteeFilter = setGiteeFilter
  nextModel.giteeSearch = giteeSearch
  nextModel.setGiteeSearch = setGiteeSearch
  nextModel.giteeNewIssueOpen = giteeNewIssueOpen
  nextModel.setGiteeNewIssueOpen = setGiteeNewIssueOpen
  nextModel.giteeNewIssueTitle = giteeNewIssueTitle
  nextModel.setGiteeNewIssueTitle = setGiteeNewIssueTitle
  nextModel.giteeNewIssueBody = giteeNewIssueBody
  nextModel.setGiteeNewIssueBody = setGiteeNewIssueBody
  nextModel.giteeNewIssueSubmitting = giteeNewIssueSubmitting
  nextModel.setGiteeNewIssueSubmitting = setGiteeNewIssueSubmitting
  nextModel.giteeNewIssueRepoId = giteeNewIssueRepoId
  nextModel.setGiteeNewIssueRepoId = setGiteeNewIssueRepoId
  nextModel.giteeNewIssueTargetRepo = giteeNewIssueTargetRepo
  nextModel.giteeNewPullRequestOpen = giteeNewPullRequestOpen
  nextModel.setGiteeNewPullRequestOpen = setGiteeNewPullRequestOpen
  nextModel.giteeNewPullRequestTitle = giteeNewPullRequestTitle
  nextModel.setGiteeNewPullRequestTitle = setGiteeNewPullRequestTitle
  nextModel.giteeNewPullRequestBody = giteeNewPullRequestBody
  nextModel.setGiteeNewPullRequestBody = setGiteeNewPullRequestBody
  nextModel.giteeNewPullRequestBase = giteeNewPullRequestBase
  nextModel.setGiteeNewPullRequestBase = setGiteeNewPullRequestBase
  nextModel.giteeNewPullRequestHead = giteeNewPullRequestHead
  nextModel.setGiteeNewPullRequestHead = setGiteeNewPullRequestHead
  nextModel.giteeNewPullRequestSubmitting = giteeNewPullRequestSubmitting
  nextModel.setGiteeNewPullRequestSubmitting = setGiteeNewPullRequestSubmitting
  return nextModel
}
export type TaskPageProviderStateModel = ReturnType<typeof useTaskPageProviderState>
