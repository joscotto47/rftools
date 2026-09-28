export type ToolCategory = 'RF' | 'Wi-Fi' | 'Networking' | 'PoE'

export type Tool = {
  /** Label in the sidebar menu. */
  name: string
  /** Title on the dashboard card. */
  title: string
  description: string
  path: string
  category: ToolCategory
}
