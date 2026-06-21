/**
 * Display sanitization helpers for attacker-controlled token display fields.
 *
 * These are pure functions with no React dependency. Apply at the discovery
 * boundary (name/symbol) and at the render boundary (logo URLs).
 *
 * Security model:
 * - Token names/symbols come from on-chain storage or third-party APIs and
 *   must be treated as attacker-controlled input.
 * - Logo URLs are rendered into a CSS `url()` sink; scheme-checking alone is
 *   insufficient — CSS-breakout characters must also be rejected.
 * - Mixed-script / confusable identifiers are flagged but NOT silently
 *   rewritten. Rewriting would change the token's identity and could mask
 *   legitimate tokens. The caller decides how to surface the flag (e.g. spam
 *   badge). Residual risk: a sufficiently sophisticated homoglyph attack using
 *   characters within a single script (e.g. all-Cyrillic lookalikes) will not
 *   be caught by this basic mixed-script detector. Full TR39 skeleton-algorithm
 *   confusable rejection is out of scope for v1.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum length for sanitized token display strings (name / symbol). */
const MAX_DISPLAY_LENGTH = 64

/**
 * Control characters: U+0000–U+001F (C0 controls), U+007F (DEL), and
 * U+0080–U+009F (C1 controls, including U+009B CSI — an ANSI escape introducer
 * that can inject terminal escapes into server logs via console.error).
 * These are invisible and can be used to manipulate terminal/UI rendering.
 */
// eslint-disable-next-line no-control-regex -- intentionally matches C0/C1 control chars to strip them
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F-\u009F]/g

/**
 * Bidirectional / RTL override characters.
 * - U+200E LEFT-TO-RIGHT MARK, U+200F RIGHT-TO-LEFT MARK
 * - U+202A–U+202E: LRE, RLE, PDF, LRO, RLO
 * - U+2066–U+2069: LRI, RLI, FSI, PDI
 *
 * These are the primary vectors for "right-to-left override" phishing attacks
 * where a token name appears to spell one thing but renders as another.
 */
const BIDI_CHARS_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

/**
 * Markup / URL fragment characters that could be injected into HTML or
 * interpreted as markup. Angle brackets are the primary concern; stripping
 * them renders any embedded HTML/SVG/XML inert.
 *
 * Also strip obvious URL scheme prefixes (http:// https://) that have no
 * place in a token name and could confuse users into clicking.
 */
const ANGLE_BRACKETS_RE = /[<>]/g
const URL_SCHEME_RE = /https?:\/\//gi

/**
 * Characters that are unsafe in a CSS `url()` context. A URL containing any
 * of these can break out of the `backgroundImage: url(${logoURI})` sink:
 * - `"` and `'` — close a quoted string
 * - `)` — closes the url() function
 * - Whitespace (space, tab, CR, LF, FF) — terminates an unquoted URL
 * - Null byte — terminates strings in some parsers
 */

const CSS_URL_UNSAFE_RE = /["')\s\0]/

// ---------------------------------------------------------------------------
// Script detection for mixed-script / confusable detection
// ---------------------------------------------------------------------------

/**
 * Unicode script ranges used for mixed-script detection.
 * We check for the most common lookalike-script combinations used in phishing:
 * Latin mixed with Cyrillic or Greek.
 *
 * These ranges cover the core blocks; supplementary characters in the same
 * scripts are not covered (acceptable for v1 — see module-level comment).
 */
const LATIN_RE = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/
const CYRILLIC_RE = /[\u0400-\u04FF\u0500-\u052F]/
const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sanitize a token name or symbol for safe display.
 *
 * Transformations applied (in order):
 * 1. Strip control characters (U+0000–U+001F, U+007F).
 * 2. Strip bidirectional/RTL override characters.
 * 3. Apply Unicode NFC normalization (canonical composition).
 * 4. Strip angle brackets and obvious URL scheme prefixes.
 * 5. Truncate to MAX_DISPLAY_LENGTH characters.
 *
 * The result is inert plain text safe for display in any context.
 * This function does NOT detect confusables — use `isConfusableTokenName`
 * for that signal.
 *
 * @param s - Raw token name or symbol from on-chain / API data.
 * @returns Sanitized display string.
 */
export function sanitizeTokenDisplay(s: string): string {
  return s
    .replaceAll(CONTROL_CHARS_RE, '')
    .replaceAll(BIDI_CHARS_RE, '')
    .normalize('NFC')
    .replaceAll(ANGLE_BRACKETS_RE, '')
    .replaceAll(URL_SCHEME_RE, '')
    .slice(0, MAX_DISPLAY_LENGTH)
}

/**
 * Validate a token logo URL for safe use in a CSS `url()` sink.
 *
 * The consumer renders logos as `backgroundImage: url(${logoURI})`. This
 * means two independent checks are required:
 *
 * 1. **Scheme allowlist**: only `https:` is permitted. `javascript:`, `data:`,
 *    `http:`, and all other schemes are rejected.
 * 2. **CSS-sink safety**: the URL must not contain characters that can break
 *    out of a CSS `url()` context — quotes (`"` `'`), closing parenthesis
 *    (`)`), whitespace, or null bytes.
 *
 * @param url - Logo URL from token metadata (may be undefined).
 * @returns `true` if the URL is safe to use in a CSS `url()` context.
 */
export function isSafeLogoUrl(url: string | undefined): boolean {
  if (url === undefined || url === '') return false

  // Scheme check: must start with https: (case-insensitive)
  // We use a URL parse rather than a simple startsWith to handle edge cases
  // like leading whitespace or unicode trickery in the scheme position.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false

  // CSS-sink safety: reject any character that can break out of url()
  if (CSS_URL_UNSAFE_RE.test(url)) return false

  return true
}

/**
 * Detect mixed-script / confusable token names (TR39-style heuristic).
 *
 * Returns `true` when the string contains characters from more than one of
 * the checked scripts (Latin, Cyrillic, Greek). This is the primary signal
 * for homoglyph phishing attacks (e.g. "USDC" spelled with a Cyrillic С).
 *
 * **Important:** This function flags suspects — it does NOT rewrite them.
 * The caller decides how to surface the flag (e.g. spam badge, lower trust
 * score). Silently rewriting confusables would change the token's identity.
 *
 * **Residual risk:** Single-script confusables (e.g. all-Cyrillic lookalikes
 * with no Latin characters) are NOT detected. Full TR39 skeleton-algorithm
 * confusable rejection is out of scope for v1.
 *
 * @param s - Token name or symbol to check.
 * @returns `true` if the string appears to mix scripts in a suspicious way.
 */
export function isConfusableTokenName(s: string): boolean {
  const hasLatin = LATIN_RE.test(s)
  const hasCyrillic = CYRILLIC_RE.test(s)
  const hasGreek = GREEK_RE.test(s)

  // Flag if more than one script is present
  const scriptCount = [hasLatin, hasCyrillic, hasGreek].filter(Boolean).length
  return scriptCount > 1
}
