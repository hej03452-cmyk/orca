import { describe, expect, it } from 'vitest'
import { deriveGiteeCommitStatus } from './pull-request-mappers'

describe('deriveGiteeCommitStatus', () => {
  it.each([[{ state: 'success' }], [{ status: 'passed' }]])('maps successful checks', (status) => {
    expect(deriveGiteeCommitStatus([status])).toBe('success')
  })

  it('prioritizes failures over pending checks', () => {
    expect(deriveGiteeCommitStatus([{ state: 'pending' }, { state: 'failure' }])).toBe('failure')
  })
})
