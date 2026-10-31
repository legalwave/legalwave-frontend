/**
 * Single source of truth for LegalWave branding.
 *
 * No component may hardcode the product name, tagline, or MCP server key —
 * import from here instead (FR-1.4).
 */
export const BRAND = {
  /** Product name — displayed in the logo lockup, page titles, and app chrome. */
  name: 'LegalWave',

  /** Full document title. */
  documentTitle: 'LegalWave — Japanese Contract Risk Analyzer',

  /** Tagline shown on the sign-in and registration screens. */
  tagline:
    "Paste a clause or upload a contract. I'll cite the relevant Japanese statutes.",

  /** Shorter variant for compact spaces such as the app top bar. */
  shortTagline: 'Japanese contract risk analysis',

  /**
   * MCP server identifier used in the client configuration snippet.
   * Renamed from `legal-assistant` — see MCP_KEY_CHANGED_NOTE below.
   */
  mcpServerKey: 'legalwave',

  /** The MCP server key this project used before the LegalWave rebrand. */
  previousMcpServerKey: 'legal-assistant',

  /** Streamable-HTTP MCP endpoint. */
  mcpServerUrl: 'http://localhost:8000/mcp',

  /** Inline logo mark (wave + scales monogram). */
  logoSrc: new URL('../assets/logo.svg', import.meta.url).href,

  /** Abstract wave-field background artwork. */
  backgroundSrc: new URL('../assets/wave-field.svg', import.meta.url).href,
} as const

/**
 * Shown beside the MCP configuration snippet so existing MCP clients know the
 * server key changed and their configuration needs updating (FR-4.7, FR-7.3).
 */
export const MCP_KEY_CHANGED_NOTE = `The MCP server key changed from "${BRAND.previousMcpServerKey}" to "${BRAND.mcpServerKey}" during the LegalWave rebrand. Update the \`mcpServers\` key in your MCP client configuration to continue using this server.`

/** Footer disclaimer shown across auth screens and the app workspace. */
export const DISCLAIMER = 'Not legal advice · Verdicts are informational'
