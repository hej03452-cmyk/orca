/** Gitee 项目或里程碑在任务页中的展示模型。 */
export type GiteeProjectInfo = {
  id: string
  name: string
  description: string
  state: string
  url: string
  updatedAt: string
  repoId?: string
}
