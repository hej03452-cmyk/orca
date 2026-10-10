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

function directory(): string {
  return join(homedir(), '.orca')
}
function metadataPath(): string {
  return join(directory(), 'gitee-credential.json')
}
function secretPath(): string {
  return join(directory(), 'gitee-credential.enc')
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
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
function getMetadata(): GiteeStoredMetadata | null {
  if (metadata === undefined) {
    metadata = readMetadata()
  }
  return metadata
}
export function getStoredGiteeMetadata(): GiteeStoredMetadata | null {
  return getMetadata()
}
export function hasStoredGiteeCredential(): boolean {
  return getMetadata() !== null && credentialFileHasContent(secretPath())
}
export function getConfiguredGiteeToken(): string | null {
  return hasStoredGiteeCredential() ? loadStoredGiteeToken() : null
}
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
