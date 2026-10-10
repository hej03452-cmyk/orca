import { useEffect, useState } from 'react'
import { ArrowRight, Check, CheckCircle2, ChevronLeft, CircleDot, Copy, ExternalLink, GitMerge, GitPullRequest, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime } from '@/components/github/work-item-state-presentation'
import type { TaskPageComposerActionsModel } from '../../use-task-page-composer-actions'
import { GiteeDetailMeta } from './DetailMeta'
type Tab = 'conversation' | 'checks' | 'files'

/** 展示 Gitee Issue/PR 详情，并处理状态更新和评论提交。 */
export function TaskPageGiteeDetail({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element | null {
  const { selectedGiteeItem: item, setSelectedGiteeItem, handleUseGiteeItem } = model
  const [tab, setTab] = useState<Tab>('conversation')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const isPr = item?.kind === 'pr'
  const repo = item?.repoId ? model.repoMap.get(item.repoId) : null
  const state = item ? (isPr ? (item.prState ?? item.state) : item.state) : 'open'
  const comments = Array.isArray(item?.comments) ? item.comments : []
  const itemNumber = item?.number
  const repoPath = repo?.path
  const repoId = repo?.id
  useEffect(() => {
    if (!itemNumber || !repoPath || !repoId) {
      return
    }
    // 详情请求可能晚于用户返回列表，取消标记用于避免更新已离开的页面。
    let cancelled = false
    setLoading(true)
    setDetailError(null)
    const detailRequest = isPr
      ? window.api.gitee.pullRequest({ repoPath, repoId, number: Number(itemNumber) })
      : window.api.gitee.issue({ repoPath, repoId, number: itemNumber })
    void detailRequest
      .then((detail) => {
        if (!detail && !cancelled) {
          setDetailError('无法加载 Gitee 详情数据')
        }
        if (!cancelled && detail) {
          setSelectedGiteeItem((current) =>
            current && current.number === itemNumber
              ? {
                  ...current,
                  body: detail.body,
                  author: detail.author,
                  assignee: 'assignee' in detail ? detail.assignee : current.assignee,
                  updatedAt: detail.updatedAt,
                  ...(isPr
                    ? {
                        prState: detail.state,
                        prStatus: detail.status,
                        prMergeable: detail.mergeable,
                        headRef: detail.headRef,
                        baseRef: detail.baseRef
                      }
                    : {
                        state: detail.state,
                        labels: detail.labels,
                        comments: detail.comments,
                        commentCount: detail.commentCount
                      })
                }
              : current
          )
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailError(error instanceof Error ? error.message : '无法加载 Gitee 详情数据')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [isPr, itemNumber, repoId, repoPath, setSelectedGiteeItem])
  if (!item) {
    return null
  }
  const status =
    state === 'merged'
      ? '已合并'
      : state === 'closed'
        ? '已关闭'
        : state === 'draft'
          ? '草稿'
          : '开放'
  const update = async (action: 'close' | 'merge' | 'reopen'): Promise<void> => {
    if (!repo) {
      return
    }
    setBusy(true)
    try {
      const result = isPr
        ? action === 'reopen'
          ? { ok: false, error: '不支持' }
          : await window.api.gitee.updatePullRequest({
              repoPath: repo.path,
              repoId: repo.id,
              number: Number(item.number),
              action
            })
        : await window.api.gitee.updateIssue({
            repoPath: repo.path,
            repoId: repo.id,
            number: item.number,
            updates: { state: action === 'reopen' ? 'open' : 'closed' }
          })
      if (!result.ok) {
        throw new Error(result.error ?? '操作失败')
      }
      setSelectedGiteeItem((current) =>
        current
          ? {
              ...current,
              state: action === 'reopen' ? 'open' : 'closed',
              ...(isPr
                ? {
                    prState: action === 'merge' ? 'merged' : action === 'close' ? 'closed' : 'open'
                  }
                : {})
            }
          : current
      )
      toast.success(
        action === 'merge' ? '拉取请求已合并' : action === 'reopen' ? '议题已重新打开' : '已关闭'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }
  const addComment = async (): Promise<void> => {
    if (!repo || !comment.trim()) {
      return
    }
    setBusy(true)
    try {
      const result = await window.api.gitee.addIssueComment({
        repoPath: repo.path,
        repoId: repo.id,
        number: item.number,
        body: comment.trim()
      })
      if (!result.ok || !result.comment) {
        throw new Error(result.error ?? '发表评论失败')
      }
      setSelectedGiteeItem((current) =>
        current
          ? {
              ...current,
              comments: [
                ...(Array.isArray(current.comments) ? current.comments : []),
                result.comment!
              ]
            }
          : current
      )
      setComment('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发表评论失败')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      data-testid="gitee-item-detail"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border/50 bg-background shadow-sm"
    >
      <div className="flex-none border-b border-border/60 bg-muted/30 px-6 py-2.5">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedGiteeItem(null)}
            className="-ml-2 h-7"
          >
            <ChevronLeft className="size-4" /> Gitee 列表
          </Button>
          <span>/</span>
          <span className="font-medium text-foreground">Gitee</span>
          <span>/</span>
          <span className="font-mono">
            {isPr ? '!' : '#'}
            {item.number}
          </span>
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                void navigator.clipboard.writeText(item.url)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1200)
              }}
            >
              {copied ? (
                <Check className="size-4 text-workspace-status-review" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void window.api.shell.openUrl(item.url)}
            >
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-none border-b border-border/60 bg-card px-6 py-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex size-8 items-center justify-center rounded-md border border-border/60 bg-muted/40">
            {isPr ? <GitPullRequest className="size-4" /> : <CircleDot className="size-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-medium leading-tight">
              {item.title}
              <span className="ml-2 font-light text-muted-foreground">
                {isPr ? '!' : '#'}
                {item.number}
              </span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <span className="rounded-full bg-workspace-status-review px-3 py-1 text-xs text-white">
                {status}
              </span>
              <span className="font-semibold text-foreground">{item.author ?? '未知用户'}</span>
              <span>{isPr ? '更新了此拉取请求' : '创建了此议题'}</span>
              <span>/ 更新于 {formatRelativeTime(item.updatedAt)}</span>
            </div>
          </div>
          <Button size="sm" onClick={() => handleUseGiteeItem(item)}>
            开始工作 <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <GiteeDetailMeta item={item} status={status} />
        {detailError ? <div className="mt-3 text-xs text-destructive">{detailError}</div> : null}
        <div className="mt-4 flex gap-2">
          {!isPr && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void update(state === 'open' ? 'close' : 'reopen')}
            >
              {state === 'open' ? '关闭议题' : '重新打开'}
            </Button>
          )}
          {isPr && state === 'open' && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void update('close')}
              >
                关闭
              </Button>
              <Button size="sm" disabled={busy} onClick={() => void update('merge')}>
                <GitMerge className="size-3.5" />
                合并
              </Button>
            </>
          )}
        </div>
      </div>
      {isPr && (
        <div className="flex-none border-b border-border/60 px-6">
          <div className="flex gap-1">
            <Button
              variant={tab === 'conversation' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('conversation')}
            >
              <MessageCircle className="size-3.5" />
              讨论
            </Button>
            <Button
              variant={tab === 'checks' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('checks')}
            >
              <CheckCircle2 className="size-3.5" />
              检查
            </Button>
            <Button
              variant={tab === 'files' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('files')}
            >
              文件
            </Button>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto scrollbar-sleek bg-background px-6 py-6">
        {tab === 'conversation' && (
          <div className="space-y-5">
            <article className="rounded-md border border-border/60 bg-card p-5">
              <div className="mb-3 text-xs text-muted-foreground">
                {item.author ?? '未知用户'} / 更新于 {formatRelativeTime(item.updatedAt)}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-6">
                {item.body || '暂无描述。'}
              </div>
            </article>
            <div className="border-t border-border/60 pt-5">
              <div className="mb-4 text-sm font-medium">
                活动{' '}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {comments.length || item.commentCount || 0}
                </span>
              </div>
              {loading && comments.length === 0 ? (
                <div className="mb-3 text-xs text-muted-foreground">正在同步评论…</div>
              ) : null}
              {comments.map((entry) => (
                <article
                  key={entry.id}
                  className="mb-3 rounded-md border border-border/60 bg-card p-4"
                >
                  <div className="text-xs text-muted-foreground">
                    {entry.author ?? '未知用户'} / {formatRelativeTime(entry.createdAt)}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{entry.body}</p>
                </article>
              ))}
            </div>
            <div className="rounded-md border border-border/60 bg-card p-4">
              <div className="mb-3 flex gap-3 border-b border-border/60 pb-2 text-xs text-muted-foreground">
                <span>格式</span>
                <span>H1</span>
                <span>H2</span>
                <span>H3</span>
                <b>B</b>
                <i>I</i>
                <span>🔗</span>
                <span>•</span>
                <span>☑</span>
              </div>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="添加评论"
                className="min-h-28"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  disabled={!comment.trim() || busy}
                  onClick={() => void addComment()}
                >
                  {busy ? '发送中…' : '发表评论'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {tab === 'checks' && (
          <div className="rounded-md border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4" />
              检查
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {loading
                ? '正在加载检查结果…'
                : item.prStatus === 'success'
                  ? '所有检查已通过'
                  : '暂无检查结果'}
            </p>
          </div>
        )}
        {tab === 'files' && (
          <div className="rounded-md border border-border/60 bg-card p-5 text-sm text-muted-foreground">
            Gitee 暂未返回文件差异。
          </div>
        )}
      </div>
    </div>
  )
}
