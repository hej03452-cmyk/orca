import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoaderCircle } from 'lucide-react'
import { isScreenSubmitShortcut } from '@/lib/screen-submit-shortcut'
import { GitHubMarkdownComposer } from '@/components/github/GitHubMarkdownComposer'
import RepoBadgeLabel from '@/components/repo/RepoBadgeLabel'

/** 提供创建 Gitee Issue 的标题、正文和目标仓库表单。 */
export function TaskPageGiteeIssueDialog({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element {
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: the staged task-page model is augmented by the Gitee creation hook before rendering.
  const giteeModel = model as TaskPageComposerActionsModel & {
    handleCreateGiteeIssue: () => Promise<void>
  }
  const {
    selectedRepos,
    giteeNewIssueOpen,
    setGiteeNewIssueOpen,
    giteeNewIssueTitle,
    setGiteeNewIssueTitle,
    giteeNewIssueBody,
    setGiteeNewIssueBody,
    giteeNewIssueSubmitting,
    giteeNewIssueRepoId,
    setGiteeNewIssueRepoId,
    giteeNewIssueTargetRepo,
    handleCreateGiteeIssue,
    submitShortcutLabel
  } = giteeModel
  return (
    <Dialog
      open={giteeNewIssueOpen}
      onOpenChange={(open) => {
        if (!giteeNewIssueSubmitting) {
          setGiteeNewIssueOpen(open)
        }
      }}
    >
      <DialogContent
        className="sm:max-w-2xl"
        onKeyDown={(event) => {
          if (isScreenSubmitShortcut(event)) {
            event.preventDefault()
            void handleCreateGiteeIssue()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{'\u65b0\u5efa Gitee \u8bae\u9898'}</DialogTitle>
          <DialogDescription>
            {'\u63d0\u4ea4\u5230 '}{giteeNewIssueTargetRepo?.displayName ?? '\u5f53\u524d\u4ed3\u5e93'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {selectedRepos.length > 1 ? (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground">{'\u9879\u76ee'}</label>
              <Select
                value={giteeNewIssueRepoId ?? undefined}
                onValueChange={setGiteeNewIssueRepoId}
                disabled={giteeNewIssueSubmitting}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {selectedRepos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id}>
                      <RepoBadgeLabel name={repo.displayName} color={repo.badgeColor} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">{'\u6807\u9898'}</label>
            <Input
              autoFocus
              value={giteeNewIssueTitle}
              onChange={(event) => setGiteeNewIssueTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  void handleCreateGiteeIssue()
                }
              }}
              placeholder={'\u8bf7\u8f93\u5165\u8bae\u9898\u6807\u9898'}
              disabled={giteeNewIssueSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">{'\u63cf\u8ff0\uff08\u53ef\u9009\uff0c\u652f\u6301 Markdown\uff09'}</label>
            <GitHubMarkdownComposer
              value={giteeNewIssueBody}
              onChange={setGiteeNewIssueBody}
              placeholder={'\u8bf7\u8f93\u5165\u8bae\u9898\u63cf\u8ff0'}
              disabled={giteeNewIssueSubmitting}
              minHeightClassName="min-h-40"
              onSubmitShortcut={() => void handleCreateGiteeIssue()}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {submitShortcutLabel} {'\u63d0\u4ea4'}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setGiteeNewIssueOpen(false)} disabled={giteeNewIssueSubmitting}>
            {'\u53d6\u6d88'}
          </Button>
          <Button onClick={() => void handleCreateGiteeIssue()} disabled={!giteeNewIssueTargetRepo || !giteeNewIssueTitle.trim() || giteeNewIssueSubmitting}>
            {giteeNewIssueSubmitting ? <><LoaderCircle className="size-4 animate-spin" />{'\u521b\u5efa\u4e2d\u2026'}</> : '\u521b\u5efa\u8bae\u9898'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
