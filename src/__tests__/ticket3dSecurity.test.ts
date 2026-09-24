import { describe, expect, it } from 'vitest'
import { escapeHtml } from '../ticket3d'

describe('Certified 3D ticket renderer security boundary', () => {
  it('escapes HTML-significant canonical ticket fields', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    )
    expect(escapeHtml('a&b"c\'d')).toBe('a&amp;b&quot;c&#39;d')
  })

  it('leaves ordinary immutable identifiers readable', () => {
    expect(escapeHtml('policy123.asset456')).toBe('policy123.asset456')
  })
})
