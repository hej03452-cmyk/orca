import type { TaskPageComposerActionsModel } from '../use-task-page-composer-actions'
import { TaskPageFrame } from './Frame'
import { TaskPageGitHubIssueDialog } from './github/IssueDialog'
import { TaskPageGiteeIssueDialog } from './gitee/IssueDialog'
import { TaskPageGiteePullRequestDialog } from './gitee/PullRequestDialog'
import { TaskPageLinearProjectDialog } from './linear/ProjectDialog'
import { TaskPageLinearIssueDialog } from './linear/IssueDialog'
import { TaskPageJiraIssueDialog } from './jira/IssueDialog'
import { TaskPageGitLabDialog } from './gitlab/Dialog'
import { TaskPageLinearConnectDialog } from './linear/ConnectDialog'
import { TaskPageJiraConnectDialog } from './jira/ConnectDialog'
export function TaskPageSurface({
  model
}: {
  model: TaskPageComposerActionsModel
}): React.JSX.Element {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-background text-foreground">
      <TaskPageFrame model={model} />

      <TaskPageGitHubIssueDialog model={model} />

      <TaskPageGiteeIssueDialog model={model} />

      <TaskPageGiteePullRequestDialog model={model} />

      <TaskPageLinearProjectDialog model={model} />

      <TaskPageLinearIssueDialog model={model} />

      <TaskPageJiraIssueDialog model={model} />

      <TaskPageGitLabDialog model={model} />

      <TaskPageLinearConnectDialog model={model} />

      <TaskPageJiraConnectDialog model={model} />
    </div>
  )
}
