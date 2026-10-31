/**
 * Route paths and path builders.
 *
 * Centralised so guards, links, and navigation all reference the same
 * strings rather than repeating literals.
 */
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  SETTINGS_API_KEY: '/settings/api-key',
  CHAT: '/',
} as const

/** Path for a specific chat thread. */
export function chatPath(id: string) {
  return `/c/${id}`
}
