import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'

/** 展示 Gitee 拉取请求的简化列表视图。 */
export function TaskPageGiteePullRequestList({ model }: { model: TaskPageComposerActionsModel }): React.JSX.Element {
  const { giteePullRequests } = model
  return <div className="flex min-h-0 max-h-full flex-col overflow-hidden rounded-md rounded-t-none border border-t-0 border-border/50 bg-background shadow-sm">
    <div className="grid grid-cols-[80px_minmax(0,1fr)_120px_50px] gap-3 border-b border-border/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground"><span>编号</span><span>标题/上下文</span><span>更新时间</span><span /></div>
    <div className="min-h-0 divide-y divide-border/40 overflow-y-auto scrollbar-sleek">
      {giteePullRequests.length === 0 ? <div className="px-4 py-12 text-center text-sm text-muted-foreground">{translate('auto.components.TaskPage.giteeNoPrs', '没有找到 Gitee PR')}</div> : giteePullRequests.map((item) => <div key={`${item.repoId}:${item.number}`} className="grid min-h-12 grid-cols-[80px_minmax(0,1fr)_120px_50px] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent"><span className="font-mono text-xs text-muted-foreground">!{item.number}</span><span className="truncate text-sm">{item.title}</span><span className="text-xs text-muted-foreground">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''}</span><Button variant="ghost" size="icon-xs" aria-label="在 Gitee 中打开" onClick={() => void window.api.shell.openUrl(item.url)}><ExternalLink className="size-3.5" /></Button></div>)}
    </div>
  </div>
}
