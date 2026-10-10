import { describe, expect, it } from 'vitest'
import { mapGiteePullRequest } from './pull-request-mappers'

describe('mapGiteePullRequest', () => {
  it('maps an open draft PR and preserves its head sha', () => {
    expect(
      mapGiteePullRequest({
        number: 12,
        title: 'Improve startup',
        state: 'open',
        draft: true,
        html_url: 'https://gitee.com/acme/orca/pulls/12',
        updated_at: '2026-09-27T00:00:00Z',
        head: { ref: 'feature/startup', sha: 'abc123' }
      })
    ).toMatchObject({ number: 12, state: 'draft', headSha: 'abc123', status: 'neutral' })
  })
})
