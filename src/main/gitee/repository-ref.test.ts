import { describe, expect, it } from 'vitest'
import { parseGiteeRepoRef } from './repository-ref'

describe('parseGiteeRepoRef', () => {
  it.each([
    'https://gitee.com/acme/orca.git',
    'git@gitee.com:acme/orca.git',
    'ssh://git@gitee.com/acme/orca'
  ])('parses %s', (remote) => {
    expect(parseGiteeRepoRef(remote)).toMatchObject({
      host: 'gitee.com',
      owner: 'acme',
      repo: 'orca',
      apiBaseUrl: 'https://gitee.com/api/v5'
    })
  })

  it.each(['https://github.com/acme/orca.git', 'https://gitea.example/acme/orca.git'])(
    'does not claim %s',
    (remote) => {
      expect(parseGiteeRepoRef(remote)).toBeNull()
    }
  )
})
