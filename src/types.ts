import type { Localized } from './i18n'

export type ToolCategory = 'RF' | 'Wi-Fi' | 'Networking' | 'PoE'

export type Tool = {
  /** Name in the sidebar menu and on the dashboard card. */
  name: Localized
  description: Localized
  path: string
  category: ToolCategory
}
