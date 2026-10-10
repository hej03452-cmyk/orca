import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Plus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type GiteeFilter = 'open' | 'progressing' | 'closed' | 'rejected' | 'all'
const labels: Record<GiteeFilter, string> = {
  open: '开放',
  progressing: '进行中',
  closed: '已关闭',
  rejected: '已拒绝',
  all: '全部'
}
const filterValues: GiteeFilter[] = ['open', 'progressing', 'closed', 'rejected', 'all']
function isFilter(value: string): value is GiteeFilter {
  return value in labels
}

export function TaskPageGiteeFilters({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element | null {
  const {
    taskSource,
    giteeMode,
    giteeLoading,
    giteeRefreshNonce,
    setGiteeRefreshNonce,
    giteeFilter,
    setGiteeFilter,
    giteeSearch,
    setGiteeSearch
  } = model
  const previousMode = useRef<typeof giteeMode>(null)
  useEffect(() => {
    if (previousMode.current !== giteeMode) {
      setGiteeSearch(
        giteeMode === 'prs' ? 'is:pr is:open' : giteeMode === 'issues' ? 'is:issue is:open' : ''
      )
      previousMode.current = giteeMode
    }
  }, [giteeMode, setGiteeSearch])
  if (taskSource !== 'gitee') {
    return null
  }
  const create = (): void => {
    if (giteeMode === 'issues') {
      model.setGiteeNewIssueOpen(true)
    }
    if (giteeMode === 'prs' && model.selectedRepos.length === 1) {
      model.setGiteeNewPullRequestOpen(true)
    }
  }
  return (
    <div
      className="flex min-w-0 flex-col gap-2.5 rounded-md rounded-b-none border border-border/50 bg-muted/35 px-3 py-2.5"
      data-contextual-tour-target="tasks-search-presets"
    >
      {giteeMode !== 'projects' ? (
        <div className="flex flex-wrap gap-1.5">
          {(['open', 'all'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setGiteeFilter(value)
                setGiteeSearch(
                  giteeMode === 'prs'
                    ? `is:pr is:${value === 'open' ? 'open' : 'all'}`
                    : `is:issue is:${value === 'open' ? 'open' : 'all'}`
                )
              }}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium transition',
                giteeFilter === value
                  ? 'border-border/50 bg-foreground/90 text-background shadow-xs'
                  : 'border-border/60 bg-background text-foreground hover:bg-muted/60'
              )}
            >
              {value === 'open' ? '开放' : '分配给我'}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <SlidersHorizontal className="size-3.5" />
              筛选
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>状态</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={giteeFilter}
              onValueChange={(value) => {
                if (isFilter(value)) {
                  setGiteeFilter(value)
                }
              }}
            >
              {filterValues.map((value) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {labels[value]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs text-muted-foreground">
              筛选条件会同步请求 Gitee API
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            variant="taskSearch"
            value={giteeSearch}
            onChange={(event) => setGiteeSearch(event.target.value)}
            placeholder="搜索议题、拉取请求或项目"
          />
          {giteeSearch ? (
            <button
              type="button"
              aria-label="清除搜索"
              onClick={() => setGiteeSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        {giteeMode !== 'projects' ? (
          <Button
            variant="outline"
            size="icon"
            aria-label="新建"
            onClick={create}
            disabled={
              !model.selectedRepos.length ||
              (giteeMode === 'prs' && model.selectedRepos.length !== 1)
            }
            className="size-8"
          >
            <Plus className="size-4" />
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          aria-label="刷新 Gitee"
          onClick={() => setGiteeRefreshNonce(giteeRefreshNonce + 1)}
          disabled={giteeLoading}
          className="size-8"
        >
          <RefreshCw className={cn('size-4', giteeLoading && 'animate-spin')} />
        </Button>
      </div>
    </div>
  )
}
