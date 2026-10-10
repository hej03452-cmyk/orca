/** Gitee 凭据来源；当前只支持 Orca 本地保存，不读取环境变量。 */
export type GiteeCredentialSource = 'stored' | 'none'

/** 设置页可展示的连接状态，不包含敏感令牌。 */
export type GiteeConnectionStatus = {
  configured: boolean
  source: GiteeCredentialSource
  account: string | null
  baseUrl: string | null
}

/** 连接验证结果。 */
export type GiteeConnectResult = { ok: true; account: string | null } | { ok: false; error: string }
