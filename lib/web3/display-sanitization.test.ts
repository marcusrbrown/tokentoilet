import {describe, expect, it} from 'vitest'

import {isConfusableTokenName, isSafeLogoUrl, sanitizeTokenDisplay} from './display-sanitization'

// ---------------------------------------------------------------------------
// sanitizeTokenDisplay
// ---------------------------------------------------------------------------

describe('sanitizeTokenDisplay', () => {
  describe('happy path — benign strings pass through unchanged', () => {
    it('passes through a plain ASCII token name', () => {
      expect(sanitizeTokenDisplay('USD Coin')).toBe('USD Coin')
    })

    it('passes through a plain ASCII token symbol', () => {
      expect(sanitizeTokenDisplay('USDC')).toBe('USDC')
    })

    it('passes through a name with numbers and spaces', () => {
      expect(sanitizeTokenDisplay('Wrapped Ether 2')).toBe('Wrapped Ether 2')
    })

    it('passes through a name with accented Latin characters', () => {
      // Accented chars are not control/bidi chars and should survive
      expect(sanitizeTokenDisplay('Café Token')).toBe('Café Token')
    })
  })

  describe('control character stripping', () => {
    it('strips a null byte (U+0000)', () => {
      expect(sanitizeTokenDisplay('BAD\u0000TOKEN')).toBe('BADTOKEN')
    })

    it('strips a C0 control character (U+0001)', () => {
      expect(sanitizeTokenDisplay('BAD\u0001TOKEN')).toBe('BADTOKEN')
    })

    it('strips a tab character (U+0009)', () => {
      expect(sanitizeTokenDisplay('BAD\u0009TOKEN')).toBe('BADTOKEN')
    })

    it('strips a newline (U+000A)', () => {
      expect(sanitizeTokenDisplay('BAD\nTOKEN')).toBe('BADTOKEN')
    })

    it('strips a carriage return (U+000D)', () => {
      expect(sanitizeTokenDisplay('BAD\rTOKEN')).toBe('BADTOKEN')
    })

    it('strips the DEL character (U+007F)', () => {
      expect(sanitizeTokenDisplay('BAD\u007FTOKEN')).toBe('BADTOKEN')
    })

    it('strips multiple control characters', () => {
      expect(sanitizeTokenDisplay('\u0001\u0002\u001FTOKEN\u007F')).toBe('TOKEN')
    })
  })

  describe('bidirectional / RTL override character stripping', () => {
    it('strips RIGHT-TO-LEFT OVERRIDE (U+202E) — the classic RTL phishing char', () => {
      // An attacker might use this to make "EVIL" appear as "LIVE" in some renderers
      expect(sanitizeTokenDisplay('EVI\u202EL')).toBe('EVIL')
    })

    it('strips LEFT-TO-RIGHT MARK (U+200E)', () => {
      expect(sanitizeTokenDisplay('TO\u200EKEN')).toBe('TOKEN')
    })

    it('strips RIGHT-TO-LEFT MARK (U+200F)', () => {
      expect(sanitizeTokenDisplay('TO\u200FKEN')).toBe('TOKEN')
    })

    it('strips LEFT-TO-RIGHT EMBEDDING (U+202A)', () => {
      expect(sanitizeTokenDisplay('TO\u202AKEN')).toBe('TOKEN')
    })

    it('strips RIGHT-TO-LEFT EMBEDDING (U+202B)', () => {
      expect(sanitizeTokenDisplay('TO\u202BKEN')).toBe('TOKEN')
    })

    it('strips POP DIRECTIONAL FORMATTING (U+202C)', () => {
      expect(sanitizeTokenDisplay('TO\u202CKEN')).toBe('TOKEN')
    })

    it('strips LEFT-TO-RIGHT OVERRIDE (U+202D)', () => {
      expect(sanitizeTokenDisplay('TO\u202DKEN')).toBe('TOKEN')
    })

    it('strips LEFT-TO-RIGHT ISOLATE (U+2066)', () => {
      expect(sanitizeTokenDisplay('TO\u2066KEN')).toBe('TOKEN')
    })

    it('strips RIGHT-TO-LEFT ISOLATE (U+2067)', () => {
      expect(sanitizeTokenDisplay('TO\u2067KEN')).toBe('TOKEN')
    })

    it('strips FIRST STRONG ISOLATE (U+2068)', () => {
      expect(sanitizeTokenDisplay('TO\u2068KEN')).toBe('TOKEN')
    })

    it('strips POP DIRECTIONAL ISOLATE (U+2069)', () => {
      expect(sanitizeTokenDisplay('TO\u2069KEN')).toBe('TOKEN')
    })

    it('strips multiple bidi chars in sequence', () => {
      expect(sanitizeTokenDisplay('\u202E\u2066\u2069USDC')).toBe('USDC')
    })
  })

  describe('Unicode NFC normalization', () => {
    it('composes a decomposed character into its NFC form', () => {
      // 'é' can be represented as:
      //   NFC: U+00E9 (single precomposed character)
      //   NFD: U+0065 U+0301 (e + combining acute accent)
      const nfd = '\u0065\u0301' // NFD form of é
      const nfc = '\u00E9' // NFC form of é
      expect(sanitizeTokenDisplay(nfd)).toBe(nfc)
    })

    it('leaves already-NFC strings unchanged', () => {
      const nfc = 'Café'
      expect(sanitizeTokenDisplay(nfc)).toBe(nfc)
    })
  })

  describe('markup and URL fragment stripping', () => {
    it('strips angle brackets (HTML injection vector)', () => {
      expect(sanitizeTokenDisplay('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
    })

    it('strips a lone opening angle bracket', () => {
      expect(sanitizeTokenDisplay('TOKEN<')).toBe('TOKEN')
    })

    it('strips http:// URL scheme prefix', () => {
      expect(sanitizeTokenDisplay('http://evil.com')).toBe('evil.com')
    })

    it('strips https:// URL scheme prefix', () => {
      expect(sanitizeTokenDisplay('https://evil.com')).toBe('evil.com')
    })

    it('strips mixed-case URL scheme (HTTP://)', () => {
      expect(sanitizeTokenDisplay('HTTP://evil.com')).toBe('evil.com')
    })
  })

  describe('length truncation', () => {
    it('truncates a string longer than 64 characters', () => {
      const long = 'A'.repeat(100)
      const result = sanitizeTokenDisplay(long)
      expect(result).toHaveLength(64)
      expect(result).toBe('A'.repeat(64))
    })

    it('does not truncate a string of exactly 64 characters', () => {
      const exact = 'B'.repeat(64)
      expect(sanitizeTokenDisplay(exact)).toBe(exact)
    })

    it('does not truncate a string shorter than 64 characters', () => {
      const short = 'Short Token Name'
      expect(sanitizeTokenDisplay(short)).toBe(short)
    })

    it('truncation applies after stripping (strip first, then truncate)', () => {
      // 60 A's + RTL override + 10 more A's = 71 chars raw, but after stripping
      // the bidi char it becomes 70 A's, which truncates to 64.
      const s = `${'A'.repeat(60)}\u202E${'A'.repeat(10)}`
      const result = sanitizeTokenDisplay(s)
      expect(result).toHaveLength(64)
      expect(result).toBe('A'.repeat(64))
    })
  })
})

// ---------------------------------------------------------------------------
// isSafeLogoUrl
// ---------------------------------------------------------------------------

describe('isSafeLogoUrl', () => {
  describe('happy path — safe HTTPS URLs', () => {
    it('accepts a plain HTTPS URL', () => {
      expect(isSafeLogoUrl('https://example.com/logo.png')).toBe(true)
    })

    it('accepts an HTTPS URL with a path and query string', () => {
      expect(isSafeLogoUrl('https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579')).toBe(true)
    })

    it('accepts an HTTPS URL with a subdomain', () => {
      expect(isSafeLogoUrl('https://cdn.example.com/tokens/usdc.svg')).toBe(true)
    })
  })

  describe('scheme rejection', () => {
    it('rejects javascript: scheme', () => {
      expect(isSafeLogoUrl('javascript:alert(1)')).toBe(false)
    })

    it('rejects data: scheme', () => {
      expect(isSafeLogoUrl('data:image/png;base64,abc123')).toBe(false)
    })

    it('rejects http: scheme', () => {
      expect(isSafeLogoUrl('http://example.com/logo.png')).toBe(false)
    })

    it('rejects ftp: scheme', () => {
      expect(isSafeLogoUrl('ftp://example.com/logo.png')).toBe(false)
    })

    it('rejects blob: scheme', () => {
      expect(isSafeLogoUrl('blob:https://example.com/abc')).toBe(false)
    })

    it('rejects file: scheme', () => {
      expect(isSafeLogoUrl('file:///etc/passwd')).toBe(false)
    })
  })

  describe('undefined / empty / malformed input', () => {
    it('returns false for undefined', () => {
      expect(isSafeLogoUrl(undefined)).toBe(false)
    })

    it('returns false for an empty string', () => {
      expect(isSafeLogoUrl('')).toBe(false)
    })

    it('returns false for a non-URL string', () => {
      expect(isSafeLogoUrl('not a url')).toBe(false)
    })

    it('returns false for a relative path', () => {
      expect(isSafeLogoUrl('/images/logo.png')).toBe(false)
    })
  })

  describe('CSS url() sink safety — characters that break out of url()', () => {
    it('rejects a URL containing a closing parenthesis (breaks url() context)', () => {
      expect(isSafeLogoUrl('https://example.com/y).png')).toBe(false)
    })

    it('rejects a URL containing a double quote', () => {
      expect(isSafeLogoUrl('https://example.com/"onload=alert(1)')).toBe(false)
    })

    it('rejects a URL containing a single quote', () => {
      expect(isSafeLogoUrl("https://example.com/'onload=alert(1)")).toBe(false)
    })

    it('rejects a URL containing a space', () => {
      expect(isSafeLogoUrl('https://example.com/logo with space.png')).toBe(false)
    })

    it('rejects a URL containing a newline', () => {
      expect(isSafeLogoUrl('https://example.com/logo\n.png')).toBe(false)
    })

    it('rejects a URL containing a carriage return', () => {
      expect(isSafeLogoUrl('https://example.com/logo\r.png')).toBe(false)
    })

    it('rejects a URL containing a tab', () => {
      expect(isSafeLogoUrl('https://example.com/logo\t.png')).toBe(false)
    })

    it('rejects a URL containing a null byte', () => {
      expect(isSafeLogoUrl('https://example.com/logo\u0000.png')).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// isConfusableTokenName
// ---------------------------------------------------------------------------

describe('isConfusableTokenName', () => {
  describe('happy path — plain ASCII / single-script names are not flagged', () => {
    it('does not flag a plain ASCII name', () => {
      expect(isConfusableTokenName('USDC')).toBe(false)
    })

    it('does not flag a plain ASCII name with spaces', () => {
      expect(isConfusableTokenName('USD Coin')).toBe(false)
    })

    it('does not flag a name with numbers only', () => {
      expect(isConfusableTokenName('1INCH')).toBe(false)
    })

    it('does not flag a name with accented Latin characters (single script)', () => {
      // Accented Latin is still Latin — not a mixed-script situation
      expect(isConfusableTokenName('Café')).toBe(false)
    })
  })

  describe('mixed-script detection — flags suspicious combinations', () => {
    it('flags a name mixing Latin and Cyrillic characters', () => {
      // Cyrillic 'С' (U+0421) looks identical to Latin 'C' — classic phishing
      const mixedName = 'USD\u0421' // "USD" + Cyrillic С
      expect(isConfusableTokenName(mixedName)).toBe(true)
    })

    it('flags a name mixing Latin and Greek characters', () => {
      // Greek 'Α' (U+0391) looks identical to Latin 'A'
      const mixedName = 'USD\u0391' // "USD" + Greek Alpha
      expect(isConfusableTokenName(mixedName)).toBe(true)
    })

    it('flags a name mixing Cyrillic and Greek characters', () => {
      const mixedName = '\u0410\u0391' // Cyrillic А + Greek Α
      expect(isConfusableTokenName(mixedName)).toBe(true)
    })

    it('flags a realistic USDC homoglyph with Cyrillic С', () => {
      // Attacker replaces Latin C with Cyrillic С (U+0421)
      const homoglyph = 'USD\u0421' // looks like "USDC" but has Cyrillic С
      expect(isConfusableTokenName(homoglyph)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('does not flag an empty string', () => {
      expect(isConfusableTokenName('')).toBe(false)
    })

    it('does not flag a purely Cyrillic name (single script)', () => {
      // All-Cyrillic is a single script — not flagged by this detector.
      // This is the documented residual risk: single-script confusables are
      // not caught by the mixed-script heuristic.
      const cyrillic = '\u0421\u0422\u0423' // СТУ in Cyrillic
      expect(isConfusableTokenName(cyrillic)).toBe(false)
    })

    it('does not flag a purely Greek name (single script)', () => {
      const greek = '\u0391\u0392\u0393' // ΑΒΓ in Greek
      expect(isConfusableTokenName(greek)).toBe(false)
    })
  })
})
