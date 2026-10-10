import { describe, expect, it } from 'vitest'
import { mapGiteeIssue } from './issue-types'

describe('mapGiteeIssue', () => {
  it('maps issue fields without exposing provider-specific raw data', () => {
    expect(
      mapGiteeIssue({
        number: '7',
        title: 'Bug',
        state: 'open',
        html_url: 'https://gitee.com/a/r/issues/7',
        body: 'Details',
        labels: [{ name: 'bug' }],
        user: { login: 'alice' }
      })
    ).toMatchObject({
      number: '7',
      title: 'Bug',
      state: 'open',
      url: 'https://gitee.com/a/r/issues/7',
      body: 'Details',
      updatedAt: '',
      author: 'alice',
      labels: ['bug'],
      assignee: null
    })
  })

  it('preserves Gitee string issue identifiers', () => {
    expect(
      mapGiteeIssue({
        number: 'IKIZKK',
        title: 'test',
        state: 'open',
        html_url: 'https://gitee.com/a/r/issues/IKIZKK'
      })
    ).toMatchObject({ number: 'IKIZKK', title: 'test' })
    expect(
      mapGiteeIssue({
        number: '7',
        title: 'test',
        state: 'open',
        html_url: 'https://gitee.com/a/r/issues/7'
      })
    ).toMatchObject({ number: '7', title: 'test' })
  })

  it('ignores numeric comment counts returned by list endpoints', () => {
    expect(
      mapGiteeIssue({
        number: '8',
        title: 'comments count',
        html_url: 'https://gitee.com/a/r/issues/8',
        comments: 3
      })
    ).toMatchObject({ number: '8', comments: undefined, commentCount: 3 })
  })

  it('maps assignees and inline comments from issue details', () => {
    expect(
      mapGiteeIssue({
        number: '9',
        title: 'detail',
        html_url: 'https://gitee.com/a/r/issues/9',
        assignee: { login: 'bob' },
        comments: [{ id: 1, body: 'comment', user: { login: 'alice' } }]
      })
    ).toMatchObject({
      assignee: 'bob',
      commentCount: undefined,
      comments: [{ id: '1', author: 'alice', body: 'comment' }]
    })
  })
})
