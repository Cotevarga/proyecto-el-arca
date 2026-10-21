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

describe('formato enriquecido', () => {
  it('aplica negrita, cursiva, subrayado y enlaces seguros', () => {
    const el = document.createElement('p')
    C.setText(el, 'Hola **fuerte** y *suave* y __sub__ [web](https://a.cl) [mal](javascript:x)\nlínea')
    expect(el.querySelector('strong').textContent).toBe('fuerte')
    expect(el.querySelector('em').textContent).toBe('suave')
    expect(el.querySelector('u').textContent).toBe('sub')
    expect(el.querySelectorAll('a')).toHaveLength(1)
    expect(el.querySelector('a').getAttribute('rel')).toContain('noopener')
    expect(el.querySelector('br')).not.toBeNull()
  })

  it('nunca inyecta HTML', () => {
    const el = document.createElement('p')
    C.setText(el, '<img src=x onerror=alert(1)> **<b>x</b>**')
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('b')).toBeNull()
  })

  it('convierte HTML del editor a marcado y viceversa', () => {
    const ed = document.createElement('div')
    ed.innerHTML = 'Un <b>fuerte</b> <i>texto</i> con <a href="https://x.cl">link</a> * literal'
    const m = C.fromEditor(ed)
    expect(m).toBe('Un **fuerte** *texto* con [link](https://x.cl) \\* literal')
    const back = document.createElement('p')
    C.setText(back, m)
    expect(back.textContent).toBe('Un fuerte texto con link * literal')
  })

  it('collect conserva el formato original como marcado', () => {
    const b = body('<p>Hola <strong>mundo</strong></p>')
    expect(C.collect(b, 'x').texts[0].markup).toBe('Hola **mundo**')
  })
})

describe('texto alternativo', () => {
  it('aplica el alt editado a la imagen', () => {
    const b = body('<img src="/a.jpg" alt="viejo">')
    const f = C.collect(b, 'index')
    expect(f.images[0].altKey).toBe(C.altKey('index', '/a.jpg'))
    C.apply(b, 'index', { [f.images[0].altKey]: 'Marcha por la memoria' })
    expect(b.querySelector('img').getAttribute('alt')).toBe('Marcha por la memoria')
  })
})
