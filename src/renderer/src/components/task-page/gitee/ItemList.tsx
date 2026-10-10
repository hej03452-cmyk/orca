import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'

const zh = { id: '\u7f16\u53f7', title: '\u6807\u9898/\u4e0a\u4e0b\u6587', updated: '\u66f4\u65b0\u65f6\u95f4', loading: '\u6b63\u5728\u52a0\u8f7d Gitee \u8bae\u9898\u2026', empty: '\u6ca1\u6709\u627e\u5230\u5339\u914d\u7684 Gitee \u8bae\u9898', open: '\u5728 Gitee \u4e2d\u6253\u5f00' }
/** 展示只包含 Gitee Issue 的精简列表。 */
export function TaskPageGiteeItemList({ model }: { model: TaskPageComposerActionsModel }): React.JSX.Element {
  const { giteeItems, giteeLoading, giteeError, openGiteeDetail, giteeSearch } = model
  const searchText = giteeSearch
    .replace(/\bis:(?:issue|pr|open|closed|all)\b/gi, '')
    .trim()
    .toLocaleLowerCase()
  const visibleItems = giteeItems.filter((item) => !searchText || item.title.toLocaleLowerCase().includes(searchText))
  return <div className="flex min-h-0 max-h-full flex-col overflow-hidden rounded-md rounded-t-none border border-t-0 border-border/50 bg-background shadow-sm"><div className="grid grid-cols-[80px_minmax(0,1fr)_120px_50px] gap-3 border-b border-border/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground"><span>{zh.id}</span><span>{zh.title}</span><span>{zh.updated}</span><span /></div><div className="min-h-0 overflow-y-auto scrollbar-sleek">{giteeError ? <div className="border-b border-border px-4 py-4 text-sm text-destructive">{giteeError}</div> : null}{giteeLoading && visibleItems.length === 0 ? <div className="px-4 py-12 text-center text-sm text-muted-foreground">{translate('auto.components.TaskPage.giteeLoading', zh.loading)}</div> : null}{!giteeLoading && visibleItems.length === 0 && !giteeError ? <div className="px-4 py-12 text-center text-sm text-muted-foreground">{translate('auto.components.TaskPage.giteeEmpty', zh.empty)}</div> : null}<div className="divide-y divide-border/40">{visibleItems.map((item) => <div key={`${item.repoId}:${item.number}`} role="button" tabIndex={0} className="grid min-h-12 w-full cursor-pointer grid-cols-[80px_minmax(0,1fr)_120px_50px] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent" onClick={() => openGiteeDetail(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGiteeDetail(item) } }}><span className="font-mono text-xs text-muted-foreground">#{item.number}</span><span className="truncate text-sm">{item.title}</span><span className="text-xs text-muted-foreground">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''}</span><Button variant="ghost" size="icon-xs" aria-label={translate('auto.components.TaskPage.giteeOpen', zh.open)} onClick={(event) => { event.stopPropagation(); void window.api.shell.openUrl(item.url) }}><ArrowRight className="size-3.5" /></Button></div>)}</div></div></div>
}
