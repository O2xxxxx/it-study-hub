/**
 * 极简 DOMPurify 风格的兜底清洗。
 * 后端已用 OWASP Java HTML Sanitizer 产出 contentHtml，前端再挡一层：
 * 去掉脚本类标签、事件属性、危险协议链接，防止后端清洗被绕过时直接执行。
 */
const BLOCKED_TAGS = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'form', 'input',
  'button', 'textarea', 'select', 'option', 'meta', 'link', 'base', 'template', 'svg', 'math',
])

const DANGEROUS_PROTOCOL = /^\s*(javascript|vbscript|data:text\/html|data:image\/svg\+xml)/i

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '')
  }
  const doc = new window.DOMParser().parseFromString(html, 'text/html')
  const nodes = Array.from(doc.body.querySelectorAll('*'))
  for (const node of nodes) {
    const tag = node.tagName.toLowerCase()
    if (BLOCKED_TAGS.has(tag)) {
      node.remove()
      continue
    }
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') {
        node.removeAttribute(attr.name)
        continue
      }
      if (name === 'href' || name === 'src' || name === 'xlink:href' || name === 'poster') {
        if (DANGEROUS_PROTOCOL.test(value)) node.removeAttribute(attr.name)
        continue
      }
      if (name === 'style' && /expression\(|url\(\s*['"]?\s*javascript/i.test(value)) {
        node.removeAttribute(attr.name)
      }
    }
  }
  return doc.body.innerHTML
}
