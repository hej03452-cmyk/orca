import { CircleDot, FolderKanban, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GiteeTaskItem } from '../../../../../shared/gitee-issue-types'

/** 展示 Gitee 详情页的状态、负责人、标签和工作区元数据。 */
export function GiteeDetailMeta({
  item,
  status
}: {
  item: GiteeTaskItem
  status: string
}): React.JSX.Element {
  return (
    <div className="mt-5 grid grid-cols-1 gap-5 border-t border-border/60 pt-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="min-w-0">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">状态</div>
        <Button type="button" variant="outline" size="sm" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <CircleDot className="size-3.5 text-workspace-status-review" />
            {status}
          </span>
          <span className="text-muted-foreground">⌄</span>
        </Button>
      </div>
      <div className="min-w-0">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">负责人</div>
        <div className="flex h-8 items-center gap-2 text-xs font-medium">
          <span className="flex size-5 items-center justify-center rounded-full border border-border/60 bg-muted text-[10px]">
            {(item.author ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate">{item.assignee ?? '未分配'}</span>
          <Pencil className="ml-auto size-3 text-muted-foreground" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">标签</div>
        <div className="flex min-h-8 flex-wrap items-center gap-1">
          {item.labels.length ? (
            item.labels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px]"
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">无标签</span>
          )}
          <Pencil className="ml-auto size-3 text-muted-foreground" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">工作区</div>
        <div className="flex h-8 items-center gap-2 text-xs text-muted-foreground">
          <FolderKanban className="size-3.5" />
          <span>尚未关联工作区</span>
        </div>
      </div>
    </div>
  )
}
