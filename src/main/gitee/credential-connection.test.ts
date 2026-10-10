import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getConfiguredTokenMock, getMetadataMock, hasCredentialMock, saveCredentialMock, clearCredentialMock } =
  vi.hoisted(() => ({
    getConfiguredTokenMock: vi.fn(),
    getMetadataMock: vi.fn(),
    hasCredentialMock: vi.fn(),
    saveCredentialMock: vi.fn(),
    clearCredentialMock: vi.fn()
  }))

vi.mock('./credential-store', () => ({
  getConfiguredGiteeToken: getConfiguredTokenMock,
  getStoredGiteeMetadata: getMetadataMock,
  hasStoredGiteeCredential: hasCredentialMock,
  saveGiteeCredential: saveCredentialMock,
  clearStoredGiteeCredential: clearCredentialMock
}))

import { connectGitee, disconnectGitee, getGiteeConnectionStatus } from './credential-connection'

describe('Gitee credential connection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    getConfiguredTokenMock.mockReset().mockReturnValue(null)
    getMetadataMock.mockReset().mockReturnValue(null)
    hasCredentialMock.mockReset().mockReturnValue(false)
    saveCredentialMock.mockReset()
    clearCredentialMock.mockReset()
  })

  it('验证成功后保存令牌和账号信息', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ login: 'orca-user' }, { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(connectGitee('  secret-token  ')).resolves.toEqual({
      ok: true,
      account: 'orca-user'
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://gitee.com/api/v5/user?access_token=secret-token',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    )
    expect(saveCredentialMock).toHaveBeenCalledWith({
      token: 'secret-token',
      account: 'orca-user',
      baseUrl: 'https://gitee.com/api/v5'
    })
  })

  it('验证失败时不会保存令牌', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    await expect(connectGitee('bad-token')).resolves.toEqual({
      ok: false,
      error: 'Gitee 登录验证失败，请检查访问令牌是否正确。'
    })
    expect(saveCredentialMock).not.toHaveBeenCalled()
  })

  it('连接状态来自 Orca 保存的凭据', () => {
    hasCredentialMock.mockReturnValue(true)
    getConfiguredTokenMock.mockReturnValue('stored-token')
    getMetadataMock.mockReturnValue({
      version: 1,
      account: 'orca-user',
      baseUrl: 'https://gitee.example/api/v5',
      updatedAt: '2026-10-10T00:00:00.000Z'
    })

    expect(getGiteeConnectionStatus()).toEqual({
      configured: true,
      source: 'stored',
      account: 'orca-user',
      baseUrl: 'https://gitee.example/api/v5'
    })
  })

  it('断开连接会清除 Orca 保存的凭据', () => {
    disconnectGitee()
    expect(clearCredentialMock).toHaveBeenCalledOnce()
  })
})
