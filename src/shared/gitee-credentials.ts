export type GiteeCredentialSource = 'stored' | 'none'

export type GiteeConnectionStatus = {
  configured: boolean
  source: GiteeCredentialSource
  account: string | null
  baseUrl: string | null
}

export type GiteeConnectResult = { ok: true; account: string | null } | { ok: false; error: string }
