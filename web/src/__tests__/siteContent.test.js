import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

let C

beforeAll(() => {
  const code = readFileSync(resolve(process.cwd(), 'site-content.js'), 'utf8')
  window.eval(code)
  C = window.ArcaContent
})

function body(html) {
  return new DOMParser().parseFromString(html, 'text/html').body
}

describe('site-content', () => {
  it('genera claves estables', () => {
    expect(C.textKey('index', 'Hola  mundo')).toBe(C.textKey('index', 'Hola mundo'))
    expect(C.textKey('index', 'a')).not.toBe(C.textKey('galeria', 'a'))
  })

  it('recolecta textos e imágenes', () => {
    const b = body('<h1>Título</h1><p>Uno<br>Dos</p><img src="/a.jpg" alt="x"><script>var a="no"</script>')
    const f = C.collect(b, 'index')
    expect(f.texts.map((t) => t.text)).toEqual(['Título', 'Uno\nDos'])
    expect(f.images[0].src).toBe('/a.jpg')
  })

  it('aplica textos (con saltos de línea) e imágenes', () => {
    const b = body('<h1>Título</h1><img src="/a.jpg">')
    const f = C.collect(b, 'index')
    C.apply(b, 'index', {
      [f.texts[0].key]: 'Nuevo\nTexto',
      [f.images[0].key]: 'https://x.supabase.co/i.png',
    })
    expect(b.querySelector('h1').innerHTML).toBe('Nuevo<br>Texto')
    expect(b.querySelector('img').getAttribute('src')).toBe('https://x.supabase.co/i.png')
  })

  it('rechaza URLs inseguras', () => {
    const b = body('<img src="/a.jpg">')
    const f = C.collect(b, 'index')
    C.apply(b, 'index', { [f.images[0].key]: 'javascript:alert(1)' })
    expect(b.querySelector('img').getAttribute('src')).toBe('/a.jpg')
  })
})
