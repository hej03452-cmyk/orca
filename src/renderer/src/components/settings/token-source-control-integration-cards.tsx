import { useEffect, useState } from 'react'
import { ExternalLink, GitPullRequestArrow, LoaderCircle, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IntegrationCardDetails, IntegrationCardShell } from './integration-card-shell'
import { usePreflightCardStatuses } from './source-control-preflight-card-status'
import { translate } from '@/i18n/i18n'
import { tokenProviderStatusLabel } from './token-source-control-status'

export function AzureDevOpsIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('azureDevOps')
  const status = unavailable ? 'unavailable' : statuses.azureDevOpsStatus
  const configured = status === 'configured'

  return (
    <IntegrationCardShell
      icon={<GitPullRequestArrow className="size-5" />}
      name="Azure DevOps"
      description={
        configured
          ? statuses.azureDevOpsAccount
            ? translate(
                'auto.components.settings.token.source.control.integration.cards.ea204f5e03',
                '{{value0}} · Pull requests and build statuses',
                { value0: statuses.azureDevOpsAccount }
              )
            : statuses.azureDevOpsBaseUrl
              ? translate(
                  'auto.components.settings.token.source.control.integration.cards.ea204f5e03',
                  '{{value0}} · Pull requests and build statuses',
                  { value0: statuses.azureDevOpsBaseUrl }
                )
              : translate(
                  'auto.components.settings.token.source.control.integration.cards.54636c65d4',
                  'Pull requests and build statuses for detected Azure Repos'
                )
          : translate(
              'auto.components.settings.token.source.control.integration.cards.0eb50d5593',
              'Pull requests and build statuses via Azure DevOps REST API tokens.'
            )
      }
      checking={status === 'checking'}
      statusTone={configured ? 'connected' : 'attention'}
      statusLabel={tokenProviderStatusLabel({
        configured,
        hasAccount: Boolean(statuses.azureDevOpsAccount),
        status
      })}
    >
      {status !== 'checking' && !configured ? (
        <IntegrationCardDetails>
          <p className="text-xs text-muted-foreground">
            {status === 'unavailable' ? (
              translate(
                'auto.components.settings.token.source.control.integration.cards.f3f47dc7de',
                'Azure DevOps status is not available in this runtime yet.'
              )
            ) : status === 'not-configured' ? (
              <>
                {translate(
                  'auto.components.settings.token.source.control.integration.cards.7bbc9c64f0',
                  'Set'
                )}{' '}
                <span className="font-mono text-[11px]">
                  {translate(
                    'auto.components.settings.token.source.control.integration.cards.48842720d2',
                    'ORCA_AZURE_DEVOPS_TOKEN'
                  )}
                </span>
                {translate(
                  'auto.components.settings.token.source.control.integration.cards.087feb92f1',
                  ', or set'
                )}{' '}
                <span className="font-mono text-[11px]">
                  {translate(
                    'auto.components.settings.token.source.control.integration.cards.fbfd237f5e',
                    'ORCA_AZURE_DEVOPS_ACCESS_TOKEN'
                  )}
                </span>
                {translate(
                  'auto.components.settings.token.source.control.integration.cards.b8a10b07c1',
                  '. Set'
                )}{' '}
                <span className="font-mono text-[11px]">
                  {translate(
                    'auto.components.settings.token.source.control.integration.cards.186a6689df',
                    'ORCA_AZURE_DEVOPS_API_BASE_URL'
                  )}
                </span>{' '}
                {translate(
                  'auto.components.settings.token.source.control.integration.cards.7bd345e3f6',
                  'only when Orca cannot derive the API base URL from the git remote.'
                )}
              </>
            ) : (
              translate(
                'auto.components.settings.token.source.control.integration.cards.40f678df73',
                'Azure DevOps credentials are configured but could not authenticate. Check the token, API base URL, and repository permissions, then restart Orca if environment variables changed.'
              )
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl(
                  status === 'not-configured'
                    ? 'https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate'
                    : 'https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests/get-pull-requests'
                )
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.token.source.control.integration.cards.1a9475dace',
                'Learn more'
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={refresh}>
              {translate(
                'auto.components.settings.token.source.control.integration.cards.793a06e899',
                'Re-check'
              )}
            </Button>
          </div>
        </IntegrationCardDetails>
      ) : null}
    </IntegrationCardShell>
  )
}

export function GiteaIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('gitea')
  const status = unavailable ? 'unavailable' : statuses.giteaStatus
  const configured = status === 'configured'

  return (
    <IntegrationCardShell
      icon={<GitPullRequestArrow className="size-5" />}
      name="Gitea"
      description={
        configured
          ? statuses.giteaAccount
            ? translate(
                'auto.components.settings.token.source.control.integration.cards.0b5242f8a2',
                '{{value0}} · Pull requests and commit statuses',
                { value0: statuses.giteaAccount }
              )
            : statuses.giteaBaseUrl
              ? translate(
                  'auto.components.settings.token.source.control.integration.cards.0b5242f8a2',
                  '{{value0}} · Pull requests and commit statuses',
                  { value0: statuses.giteaBaseUrl }
                )
              : translate(
                  'auto.components.settings.token.source.control.integration.cards.52f75876be',
                  'Pull requests and commit statuses for detected repositories'
                )
          : translate(
              'auto.components.settings.token.source.control.integration.cards.05863d2599',
              'Pull requests and commit statuses via the Gitea REST API.'
            )
      }
      checking={status === 'checking'}
      statusTone={configured ? 'connected' : 'attention'}
      statusLabel={tokenProviderStatusLabel({
        configured,
        hasAccount: Boolean(statuses.giteaAccount),
        status,
        optional: true
      })}
    >
      {status !== 'checking' && !configured ? (
        <IntegrationCardDetails>
          <p className="text-xs text-muted-foreground">
            {status === 'unavailable' ? (
              translate(
                'auto.components.settings.token.source.control.integration.cards.0613928cb3',
                'Gitea status is not available in this runtime yet.'
              )
            ) : status === 'not-configured' ? (
              <>
                {translate(
                  'auto.components.settings.token.source.control.integration.cards.fcbe0469fd',
                  'Public repositories are detected from their git remote. Set'
                )}{' '}
                <span className="font-mono text-[11px]">
                  {translate(
                    'auto.components.settings.token.source.control.integration.cards.6d5c2a3005',
                    'ORCA_GITEA_TOKEN'
                  )}
                </span>{' '}
                {translate(
                  'auto.components.settings.token.source.control.integration.cards.6da9dfa5de',
                  'for private repositories, and set'
                )}{' '}
                <span className="font-mono text-[11px]">
                  {translate(
                    'auto.components.settings.token.source.control.integration.cards.709057ad91',
                    'ORCA_GITEA_API_BASE_URL'
                  )}
                </span>{' '}
                {translate(
                  'auto.components.settings.token.source.control.integration.cards.60708f23da',
                  'only when Orca cannot derive the API URL from the remote.'
                )}
              </>
            ) : (
              translate(
                'auto.components.settings.token.source.control.integration.cards.19fb419c12',
                'Gitea credentials are configured but could not authenticate. Check the token, API base URL, and repository permissions, then restart Orca if environment variables changed.'
              )
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl('https://docs.gitea.com/next/development/api-usage')
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.token.source.control.integration.cards.1a9475dace',
                'Learn more'
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={refresh}>
              {translate(
                'auto.components.settings.token.source.control.integration.cards.793a06e899',
                'Re-check'
              )}
            </Button>
          </div>
        </IntegrationCardDetails>
      ) : null}
    </IntegrationCardShell>
  )
}

/** 设置 Gitee 凭据、显示连接状态，并触发主进程预检刷新。 */
export function GiteeIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('gitee')
  const status = unavailable ? 'unavailable' : statuses.giteeStatus
  const configured = status === 'configured'
  const statusLabel =
    status === 'checking'
      ? '检查中'
      : configured
        ? '已连接'
        : status === 'not-configured'
          ? '未配置'
          : status === 'unavailable'
            ? '暂不可用'
            : '验证失败'
  const [credential, setCredential] = useState<Awaited<
    ReturnType<typeof window.api.gitee.credentialStatus>
  > | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadCredential = (): void => {
    void window.api.gitee
      .credentialStatus()
      .then(setCredential)
      .catch(() => setCredential(null))
  }
  useEffect(loadCredential, [])
  const reload = (): void => {
    loadCredential()
    refresh()
  }
  const save = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    const result = await window.api.gitee.connect({ token })
    if (result.ok) {
      setToken('')
      setDialogOpen(false)
      reload()
    } else {
      setError(result.error)
    }
    setSaving(false)
  }
  const disconnect = async (): Promise<void> => {
    await window.api.gitee.disconnect()
    reload()
  }
  return (
    <IntegrationCardShell
      icon={<GitPullRequestArrow className="size-5" />}
      name="Gitee"
      description={
        configured
          ? statuses.giteeAccount
            ? `${statuses.giteeAccount} · 拉取请求`
            : '读取已检测到的 Gitee 仓库中的拉取请求'
          : '通过 Gitee API v5 读取拉取请求。'
      }
      checking={status === 'checking'}
      statusTone={configured ? 'connected' : 'attention'}
      statusLabel={statusLabel}
      actions={
        status !== 'checking' ? (
          <Button
            variant={credential?.source === 'stored' ? 'outline' : 'default'}
            size="sm"
            onClick={() => {
              if (credential?.source === 'stored') {
                void disconnect()
              } else {
                setDialogOpen(true)
              }
            }}
          >
            {credential?.source === 'stored' ? '断开 Gitee' : '连接 Gitee'}
          </Button>
        ) : null
      }
    >
      {status !== 'checking' && !configured ? (
        <IntegrationCardDetails>
          <p className="text-xs text-muted-foreground">
            {status === 'unavailable' ? (
              '当前运行环境暂时无法检查 Gitee 连接状态。'
            ) : status === 'not-configured' ? (
              <>
                私有仓库需要先完成 Gitee 登录，并授予 Orca 访问仓库的权限。API 地址默认为{' '}
                <span className="font-mono text-[11px]">https://gitee.com/api/v5</span>。
              </>
            ) : (
              'Gitee 登录信息无法验证，请重新登录并检查仓库访问权限。'
            )}
          </p>
          {credential?.source === 'stored' ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {credential.account ? `已连接：${credential.account}` : '已保存 Orca 凭据'}
              </span>
              <button
                className="rounded-md p-1 hover:text-destructive"
                onClick={() => void disconnect()}
                aria-label="断开 Gitee"
              >
                <Unlink className="size-3.5" />
              </button>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.api.shell.openUrl('https://gitee.com/api/v5/swagger')}
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              查看 API 文档
            </Button>
            <Button variant="ghost" size="sm" onClick={refresh}>
              重新检查
            </Button>
          </div>
          {dialogOpen ? (
            <div className="space-y-2 rounded-md border border-border/60 bg-card p-3">
              <label className="text-xs font-medium">Gitee 访问令牌</label>
              <Input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="粘贴 Gitee 访问令牌"
                autoFocus
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button size="sm" disabled={!token.trim() || saving} onClick={() => void save()}>
                  {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : '保存并验证'}
                </Button>
              </div>
            </div>
          ) : null}
        </IntegrationCardDetails>
      ) : null}
    </IntegrationCardShell>
  )
}
