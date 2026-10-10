import {
  clearStoredGiteeCredential,
  getStoredGiteeMetadata,
  getConfiguredGiteeToken,
  saveGiteeCredential
} from './credential-store'
import type { GiteeConnectionStatus, GiteeConnectResult } from '../../shared/gitee-credentials'

const DEFAULT_API_BASE_URL = 'https://gitee.com/api/v5'

/** 从不确定的 API 响应中安全读取字符串字段。 */
function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}
/** 判断 API 响应是否为可读取字段的对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/** 统一 API 地址格式，避免拼接请求路径时出现双斜杠。 */
function normalizeBaseUrl(value: string | null | undefined): string {
  return (value?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
}

/** 验证访问令牌并将其加密保存到 Orca 凭据存储。 */
export async function connectGitee(
  token: string,
  baseUrl?: string | null
): Promise<GiteeConnectResult> {
  const normalizedToken = token.trim()
  const apiBaseUrl = normalizeBaseUrl(baseUrl)
  if (!normalizedToken) {
    return { ok: false, error: '请输入 Gitee 访问令牌。' }
  }
  try {
    const response = await fetch(
      `${apiBaseUrl}/user?access_token=${encodeURIComponent(normalizedToken)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000)
      }
    )
    if (!response.ok) {
      return { ok: false, error: 'Gitee 登录验证失败，请检查访问令牌是否正确。' }
    }
    const payload: unknown = await response.json()
    const user = isRecord(payload) ? payload : {}
    const account = optionalString(user.login) ?? optionalString(user.name)
    saveGiteeCredential({ token: normalizedToken, account, baseUrl: apiBaseUrl })
    return { ok: true, account }
  } catch {
    return { ok: false, error: '无法连接 Gitee，请检查网络连接后重试。' }
  }
}

/** 删除本机保存的 Gitee 凭据，并让后续请求回到未连接状态。 */
export function disconnectGitee(): void {
  clearStoredGiteeCredential()
}

/** 返回设置页需要展示的 Gitee 连接状态，不返回令牌本身。 */
export function getGiteeConnectionStatus(): GiteeConnectionStatus {
  const token = getConfiguredGiteeToken()
  if (token) {
    const metadata = getStoredGiteeMetadata()
    return {
      configured: true,
      source: 'stored',
      account: metadata?.account ?? null,
      baseUrl: metadata?.baseUrl ?? DEFAULT_API_BASE_URL
    }
  }
  return { configured: false, source: 'none', account: null, baseUrl: null }
}
