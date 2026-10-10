import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { cn } from '@/lib/utils'
import TaskProjectSourceCombobox from '@/components/task-project-source-combobox'
import { normalizeTaskRepoSelection } from '@/components/task-page-default-repo-selection'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

function giteeRepositoryUrl(remoteUrl: string | null | undefined): string | null {
  const value = remoteUrl?.trim() ?? ''
  const scp = value.match(/^(?:[^@/:]+@)?(?:gitee\.com):([^\s]+?)(?:\.git)?$/i)
  if (scp) {
    return `https://gitee.com/${scp[1]}`
  }
  try {
    const url = new URL(value.replace(/^git\+/, ''))
    if (url.hostname.toLowerCase() !== 'gitee.com') {
      return null
    }
    const path = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '')
    return path ? `https://gitee.com/${path}` : null
  } catch {
    return null
  }
}

export function TaskPageGiteeModeControls({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element | null {
  const {
    taskSource,
    repoSelection,
    setRepoSelection,
    taskPickerGroups,
    taskPickerRepos,
    updateSettings,
    giteeMode,
    setGiteeMode,
    selectedRepos
  } = model
  if (taskSource !== 'gitee') {
    return null
  }
  const selectedRepo = selectedRepos.length === 1 ? selectedRepos[0] : null
  const giteeRepos = taskPickerRepos.filter((repo) =>
    /(?:^|[/:@])gitee\.com[/:]/i.test(repo.gitRemoteIdentity?.remoteUrl?.trim() ?? '')
  )
  const giteeGroups = taskPickerGroups.filter((group) =>
    giteeRepos.some((repo) => repo.id === group.repo.id)
  )
  const externalUrl = giteeRepositoryUrl(selectedRepo?.gitRemoteIdentity?.remoteUrl)
  const saveError = () => toast.error('保存项目选择失败')
  const modes = [
    { id: 'issues' as const, label: '议题' },
    { id: 'prs' as const, label: '拉取请求' },
    { id: 'projects' as const, label: '项目' }
  ]
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-xs">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setGiteeMode(mode.id)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition',
              giteeMode === mode.id
                ? 'border-border/50 bg-foreground/90 text-background shadow-xs'
                : 'border-border/60 bg-muted/50 text-foreground shadow-xs hover:bg-muted/70'
            )}
          >
            {mode.id === 'prs' ? 'PR' : mode.id === 'issues' ? '议题' : '项目'}
          </button>
        ))}
      </div>
      <div className="min-w-0 max-w-[220px] shrink-0">
        <TaskProjectSourceCombobox
          groups={giteeGroups}
          selected={
            new Set([...repoSelection].filter((id) => giteeRepos.some((repo) => repo.id === id)))
          }
          onChange={(next) => {
            const normalized = normalizeTaskRepoSelection(giteeRepos, next)
            setRepoSelection(normalized)
            void updateSettings({ defaultRepoSelection: [...normalized] }).catch(saveError)
          }}
          onSelectAll={() => {
            setRepoSelection(new Set(giteeRepos.map((repo) => repo.id)))
            void updateSettings({ defaultRepoSelection: null }).catch(saveError)
          }}
          triggerClassName="h-8 w-auto max-w-[220px] rounded-md border border-border/50 bg-muted/50 px-2 text-xs font-medium shadow-sm transition hover:bg-muted/50 focus:ring-2 focus:ring-ring/20 focus:outline-none"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={!externalUrl}
        onClick={() => {
          if (externalUrl) {
            void window.api.shell.openUrl(externalUrl)
          }
        }}
        aria-label={externalUrl ? '在 Gitee 中打开仓库' : '选择一个仓库'}
      >
        <ExternalLink className="size-3.5" />
      </Button>
    </div>
  )
}
