import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  credentialFileHasContent,
  readStoredCredentialToken,
  writeCredentialFileAtomic,
  writeEncryptedCredential
} from '../integration-credential-file'

export type GiteeStoredMetadata = {
  version: 1
  account: string | null
  baseUrl: string | null
  updatedAt: string
}

let metadata: GiteeStoredMetadata | null | undefined
let secret: string | null | undefined

/** Orca 为 Gitee 凭据使用独立目录，避免与仓库文件混在一起。 */
function directory(): string {
  return join(homedir(), '.orca')
}
/** 返回 Gitee 非敏感元数据文件路径。 */
function metadataPath(): string {
  return join(directory(), 'gitee-credential.json')
}
/** 返回 Gitee 加密令牌文件路径。 */
function secretPath(): string {
  return join(directory(), 'gitee-credential.enc')
}
/** 判断解析后的 JSON 是否为对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
/** 读取非敏感的账号和 API 地址元数据文件。 */
function readMetadata(): GiteeStoredMetadata | null {
  if (!existsSync(metadataPath())) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(metadataPath(), 'utf8'))
    if (!isRecord(parsed)) {
      return null
    }
    const value = parsed
    return {
      version: 1,
      account: typeof value.account === 'string' ? value.account : null,
      baseUrl: typeof value.baseUrl === 'string' ? value.baseUrl : null,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : ''
    }
  } catch {
    return null
  }
}
/** 延迟读取并缓存元数据，减少每个 API 请求的磁盘访问。 */
function getMetadata(): GiteeStoredMetadata | null {
  if (metadata === undefined) {
    metadata = readMetadata()
  }
  return metadata
}
/** 返回设置页展示的账号和 API 地址元数据。 */
export function getStoredGiteeMetadata(): GiteeStoredMetadata | null {
  return getMetadata()
}
/** 判断加密令牌文件和元数据是否同时存在。 */
export function hasStoredGiteeCredential(): boolean {
  return getMetadata() !== null && credentialFileHasContent(secretPath())
}
/** 获取已保存的令牌；环境变量不会作为回退来源。 */
export function getConfiguredGiteeToken(): string | null {
  return hasStoredGiteeCredential() ? loadStoredGiteeToken() : null
}
/** 解密本机令牌文件，失败时按未配置处理。 */
export function loadStoredGiteeToken(): string | null {
  if (secret !== undefined) {
    return secret
  }
  if (!existsSync(secretPath())) {
    secret = null
    return null
  }
  try {
    secret = readStoredCredentialToken('Gitee', readFileSync(secretPath()))
  } catch {
    secret = null
  }
  return secret
}
/** 加密写入令牌，同时保存用于展示的非敏感元数据。 */
export function saveGiteeCredential(input: {
  token: string
  account: string | null
  baseUrl: string | null
}): void {
  mkdirSync(directory(), { recursive: true })
  writeEncryptedCredential('Gitee', secretPath(), input.token)
  const next: GiteeStoredMetadata = {
    version: 1,
    account: input.account,
    baseUrl: input.baseUrl,
    updatedAt: new Date().toISOString()
  }
  writeCredentialFileAtomic(metadataPath(), Buffer.from(JSON.stringify(next, null, 2), 'utf8'))
  metadata = next
  secret = input.token
}
/** 删除令牌和元数据文件，并清空进程内缓存。 */
export function clearStoredGiteeCredential(): void {
  for (const path of [secretPath(), metadataPath()]) {
    try {
      unlinkSync(path)
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
        throw error
      }
    }
  }
  metadata = null
  secret = null
}
