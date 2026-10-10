import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LoaderCircle } from 'lucide-react'

/** 提供创建 Gitee 拉取请求所需的标题和分支表单。 */
export function TaskPageGiteePullRequestDialog({ model }: { model: TaskPageComposerActionsModel }): React.JSX.Element {
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: the staged task model is augmented by the Gitee PR creation hook.
  const state = model as TaskPageComposerActionsModel & { handleCreateGiteePullRequest: () => Promise<void> }
  return <Dialog open={state.giteeNewPullRequestOpen} onOpenChange={(open) => { if (!state.giteeNewPullRequestSubmitting) { state.setGiteeNewPullRequestOpen(open) } }}>
    <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>新建 Gitee 拉取请求</DialogTitle><DialogDescription>提交到 {state.selectedRepos[0]?.displayName ?? '当前仓库'}</DialogDescription></DialogHeader>
      <div className="flex flex-col gap-3"><label className="text-xs font-medium text-muted-foreground">标题<Input autoFocus value={state.giteeNewPullRequestTitle} onChange={(event) => state.setGiteeNewPullRequestTitle(event.target.value)} /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-medium text-muted-foreground">目标分支<Input value={state.giteeNewPullRequestBase} onChange={(event) => state.setGiteeNewPullRequestBase(event.target.value)} /></label><label className="text-xs font-medium text-muted-foreground">源分支<Input value={state.giteeNewPullRequestHead} onChange={(event) => state.setGiteeNewPullRequestHead(event.target.value)} placeholder="例如 feature/login" /></label></div><label className="text-xs font-medium text-muted-foreground">描述<Textarea value={state.giteeNewPullRequestBody} onChange={(event) => state.setGiteeNewPullRequestBody(event.target.value)} className="mt-1 min-h-40" /></label></div>
      <DialogFooter><Button variant="outline" onClick={() => state.setGiteeNewPullRequestOpen(false)} disabled={state.giteeNewPullRequestSubmitting}>取消</Button><Button onClick={() => void state.handleCreateGiteePullRequest()} disabled={!state.giteeNewPullRequestTitle.trim() || !state.giteeNewPullRequestHead.trim() || state.giteeNewPullRequestSubmitting}>{state.giteeNewPullRequestSubmitting ? <><LoaderCircle className="size-4 animate-spin" />创建中…</> : '创建拉取请求'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
