import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { ArrowRight, CircleDot, ExternalLink, GitPullRequest, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  formatRelativeTime,
  GITHUB_PR_TASK_GRID_CLASS,
  GITHUB_TASK_GRID_CLASS,
  GITHUB_TASK_HEADER_SURFACE_CLASS,
  GITHUB_TASK_STICKY_ID_CELL_CLASS,
  GITHUB_TASK_STICKY_ID_HEADER_CLASS,
  GITHUB_TASK_STICKY_TITLE_CELL_CLASS,
  GITHUB_TASK_STICKY_TITLE_HEADER_CLASS
} from '../../task-page-source-context'

/** 以 GitHub 风格表格展示 Gitee Issue 或拉取请求列表。 */
export function TaskPageGiteeList({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element {
  const {
    giteeMode,
    giteeItems,
    giteePullRequests,
    giteeLoading,
    giteeError,
    giteeSearch,
    openGiteeDetail,
    handleUseGiteeItem,
    repoMap,
    selectedRepos
  } = model
  const isPr = giteeMode === 'prs'
  const query = giteeSearch
    .replace(/\bis:(?:issue|pr|open|closed|all)\b/gi, '')
    .trim()
    .toLocaleLowerCase()
  const rows = (isPr ? giteePullRequests : giteeItems).filter(
    (item) => !query || item.title.toLocaleLowerCase().includes(query)
  )
  const grid = isPr ? GITHUB_PR_TASK_GRID_CLASS : GITHUB_TASK_GRID_CLASS
  const openItem = (item: (typeof rows)[number]) => {
    // PR 和 Issue 的字段不同，这里统一成详情页可消费的任务项结构。
    if ('labels' in item) {
      openGiteeDetail(item)
      return
    }
    openGiteeDetail({
      number: String(item.number),
      title: item.title,
      state: item.state === 'open' ? 'open' : 'closed',
      url: item.url,
      body: item.body,
      updatedAt: item.updatedAt,
      author: item.author,
      labels: [],
      repoId: item.repoId ?? '',
      kind: 'pr',
      prState: item.state,
      prStatus: item.status,
      prMergeable: item.mergeable,
      headRef: item.headRef,
      baseRef: item.baseRef
    })
  }
  return (
    <div className="flex min-h-0 min-w-0 max-h-full flex-col overflow-hidden rounded-md rounded-t-none border border-t-0 border-border/50 bg-background shadow-sm">
      <div
        className={cn(
          'sticky top-0 z-40 grid h-8 gap-3 border-b border-border/50 px-3 text-[11px] font-semibold tracking-[0.05em] text-muted-foreground [&>span]:flex [&>span]:items-center',
          GITHUB_TASK_HEADER_SURFACE_CLASS,
          grid
        )}
      >
        <span className={GITHUB_TASK_STICKY_ID_HEADER_CLASS}>ID</span>
        <span className={GITHUB_TASK_STICKY_TITLE_HEADER_CLASS}>标题 / 上下文</span>
        {isPr ? (
          <>
            <span>评审人</span>
            <span>检查项</span>
            <span>合并</span>
          </>
        ) : (
          <>
            <span>负责人</span>
            <span>状态</span>
          </>
        )}
        <span>更新时间</span>
        <span />
      </div>
      <div className="min-h-0 flex-1 overflow-auto scrollbar-sleek">
        {giteeError ? (
          <div className="border-b border-border px-4 py-4 text-sm text-destructive">
            {giteeError}
          </div>
        ) : null}
        {giteeLoading && rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            正在加载 Gitee {isPr ? '拉取请求' : '议题'}…
          </div>
        ) : null}
        {!giteeLoading && rows.length === 0 && !giteeError ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            没有找到匹配的 Gitee {isPr ? '拉取请求' : '议题'}
          </div>
        ) : null}
        <div className="divide-y divide-border/40">
          {rows.map((item) => {
            const status = isPr
              ? 'status' in item && item.status === 'success'
                ? '通过'
                : 'status' in item && item.status === 'failure'
                  ? '失败'
                  : 'status' in item && item.status === 'pending'
                    ? '检查中'
                    : '—'
              : item.state === 'open'
                ? '开放'
                : '已关闭'
            const merge = isPr
              ? item.state === 'merged'
                ? '已合并'
                : item.state === 'open'
                  ? '开放'
                  : item.state === 'draft'
                    ? '草稿'
                    : '已关闭'
              : null
            return (
              <div
                key={`${item.repoId ?? ''}:${item.number}`}
                role="button"
                tabIndex={0}
                onClick={() => openItem(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openItem(item)
                  }
                }}
                className={cn(
                  'group grid min-h-12 cursor-pointer gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  grid
                )}
              >
                <div className={GITHUB_TASK_STICKY_ID_CELL_CLASS}>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border/40 px-1.5 py-0.5 text-muted-foreground">
                    {isPr ? (
                      <GitPullRequest className="size-3" />
                    ) : (
                      <CircleDot className="size-3" />
                    )}
                    <span className="font-mono text-[11px]">
                      {isPr ? '!' : '#'}
                      {item.number}
                    </span>
                  </span>
                </div>
                <div className={GITHUB_TASK_STICKY_TITLE_CELL_CLASS}>
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-[13px] font-medium text-foreground">
                      {item.title}
                    </h3>
                    {selectedRepos.length === 1 && item.repoId && repoMap.get(item.repoId) ? (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {repoMap.get(item.repoId)?.displayName}
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                    {item.author ?? '未知作者'}
                  </span>
                </div>
                {isPr ? (
                  <>
                    <span className="text-xs text-muted-foreground">—</span>
                    <span className="text-xs text-muted-foreground">{status}</span>
                    <span className="text-xs text-muted-foreground">{merge}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">—</span>
                    <span className="text-xs text-muted-foreground">{status}</span>
                  </>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {item.updatedAt ? formatRelativeTime(item.updatedAt) : '—'}
                </span>
                <div className="flex items-center justify-start gap-1 lg:justify-end">
                  <DropdownMenu modal={false}>
                    <ButtonGroup>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={(event) => {
                          event.stopPropagation()
                          if ('labels' in item) {
                            handleUseGiteeItem(item)
                          } else {
                            openItem(item)
                          }
                        }}
                      >
                        开始
                        <ArrowRight className="size-3" />
                      </Button>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={(event) => event.stopPropagation()}
                          aria-label="更多操作"
                        >
                          <MoreVertical className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                    </ButtonGroup>
                    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenuItem onSelect={() => void window.api.shell.openUrl(item.url)}>
                        <ExternalLink className="size-4" />
                        在浏览器中打开
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
