import type { GitAdmissionTier } from '../git/command-runner/git-exec-options'
import type { GhAccountBinding } from '../../shared/github/account-binding'

export type HostedReviewLocalGitOptions = {
  remoteUrl?: string
  wslDistro?: string
  admissionTier?: GitAdmissionTier
  ghAccount?: GhAccountBinding
}

export type HostedReviewExecutionOptions = {
  /** Optional already-resolved forge remote, used when the repo registry has the remote identity. */
  remoteUrl?: string
  localGitExecOptions?: HostedReviewLocalGitOptions
  /** Paths Orca may have symlinked into this worktree. An untracked entry that
   *  is one of these is Orca's own artifact, not work the user can commit, so it
   *  must not read as "dirty" and block review creation. */
  sharedLinkPaths?: readonly string[]
}

export function getHostedReviewLocalGitOptions(
  options: HostedReviewExecutionOptions = {}
): HostedReviewLocalGitOptions {
  const wslDistro = options.localGitExecOptions?.wslDistro
  const admissionTier = options.localGitExecOptions?.admissionTier
  const ghAccount = options.localGitExecOptions?.ghAccount
  const remoteUrl = options.remoteUrl
  return {
    ...(remoteUrl ? { remoteUrl } : {}),
    ...(wslDistro ? { wslDistro } : {}),
    ...(admissionTier ? { admissionTier } : {}),
    ...(ghAccount ? { ghAccount } : {})
  }
}

export function hasHostedReviewLocalGitOptions(
  options: HostedReviewExecutionOptions = {}
): boolean {
  return Object.keys(getHostedReviewLocalGitOptions(options)).length > 0
}
