import { spawn } from "node:child_process"
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
const PORT = 9333
const planPath = process.argv[2]
const plan = JSON.parse(readFileSync(planPath, "utf8"))
const profile = mkdtempSync(join(tmpdir(), "shoot-"))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const chrome = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + profile,
  "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "about:blank",
], { stdio: "ignore", detached: false })

async function waitVersion() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch("http://127.0.0.1:" + PORT + "/json/version")
      if (r.ok) return await r.json()
    } catch {}
    await sleep(250)
  }
  throw new Error("chrome cdP not ready")
}

function client(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map()
  const events = []
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return }
    events.push(msg)
  })
  const ready = new Promise((res, rej) => { ws.addEventListener("open", () => res(null)); ws.addEventListener("error", (e) => rej(new Error("ws error"))) })
  const send = (method, params) => new Promise((res) => {
    const n = ++id
    pending.set(n, res)
    ws.send(JSON.stringify({ id: n, method, params: params || {} }))
  })
  return { ws, send, ready, events }
}

async function main() {
  const ver = await waitVersion()
  const created = await (await fetch("http://127.0.0.1:" + PORT + "/json/new?about:blank", { method: "PUT" })).json()
  const c = client(created.webSocketDebuggerUrl)
  await c.ready
  await c.send("Page.enable")
  await c.send("Runtime.enable")
  await c.send("Network.enable")
  const results = []
  const session = plan.session

  for (const step of plan.shots) {
    const w = step.w || 1440, h = step.h || 960
    await c.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: !!step.mobile })
    if (step.resetCookie !== false) {
      await c.send("Network.clearBrowserCookies")
    }
    if (step.user) {
      const res = await fetch("http://127.0.0.1:8080/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: step.user, password: step.password }) })
      const list = res.headers.getSetCookie ? res.headers.getSetCookie() : []
      const raw = list.join(";")
      const m = raw.match(/ITSESSION=([^;]+)/)
      if (m) await c.send("Network.setCookie", { name: "ITSESSION", value: m[1], url: "http://127.0.0.1:5173/" })
      results.push({ shot: step.name, login: res.status, cookie: !!m })
    }
    await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: step.media || "light" }] })
    await c.send("Page.navigate", { url: "http://127.0.0.1:5173/" })
    await sleep(700)
    await c.send("Runtime.evaluate", { expression: "(() => { localStorage.setItem('itstudy-theme', " + JSON.stringify(step.theme || "light") + "); return 'ok'; })()" })
    if (step.init) {
      await c.send("Runtime.evaluate", { expression: step.init, awaitPromise: true })
      await sleep(200)
    }
    const url = "http://127.0.0.1:5173" + step.url
    await c.send("Page.navigate", { url })
    for (let i = 0; i < 60; i++) {
      const st = await c.send("Runtime.evaluate", { expression: "document.readyState", returnByValue: true })
      if (st.result && st.result.result && st.result.result.value === "complete") break
      await sleep(150)
    }
    await sleep(step.settle == null ? 1200 : step.settle)
    for (const act of step.actions || []) {
      if (act.clickText) {
        const box = await c.send("Runtime.evaluate", { expression: "(() => { const el = [...document.querySelectorAll('button,a,[role=button]')].find(x => (x.textContent||'').includes(" + JSON.stringify(act.clickText) + ")); if (!el) return null; el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()", returnByValue: true })
        const pt = box.result && box.result.result && box.result.result.value
        if (!pt) { results.push({ shot: step.name, missing: act.clickText }); continue }
        await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pt.x, y: pt.y, button: "none" })
        await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", buttons: 1, clickCount: 1 })
        await sleep(60)
        await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", buttons: 0, clickCount: 1 })
        await sleep(act.wait == null ? 700 : act.wait)
        continue
      }
      if (act.key) {
        const parts = act.key.split("+")
        const key = parts[parts.length - 1]
        const mods = parts.slice(0, -1).reduce((m, p) => m | ({ ctrl: 2, alt: 1, shift: 8, meta: 4 }[p] || 0), 0)
        await c.send("Input.dispatchKeyEvent", { type: "keyDown", key, code: "Key" + key.toUpperCase(), modifiers: mods, windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0) })
        await c.send("Input.dispatchKeyEvent", { type: "keyUp", key, code: "Key" + key.toUpperCase(), modifiers: mods, windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0) })
        await sleep(act.wait == null ? 600 : act.wait)
        continue
      }
      if (act.typeText) {
        await c.send("Input.insertText", { text: act.typeText })
        await sleep(act.wait == null ? 900 : act.wait)
        continue
      }
      if (act.clickSelector) {
        const box = await c.send("Runtime.evaluate", { expression: "(() => { const el = document.querySelector(" + JSON.stringify(act.clickSelector) + "); if (!el) return null; el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()", returnByValue: true })
        const pt = box.result && box.result.result && box.result.result.value
        if (!pt) { results.push({ shot: step.name, missing: act.clickSelector }); continue }
        await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", buttons: 1, clickCount: 1 })
        await sleep(60)
        await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", buttons: 0, clickCount: 1 })
        await sleep(act.wait == null ? 700 : act.wait)
        continue
      }
      const ev = await c.send("Runtime.evaluate", { expression: act.js, awaitPromise: true, returnByValue: true })
      if (ev.result && ev.result.exceptionDetails) results.push({ shot: step.name, actionError: ev.result.exceptionDetails.text })
      await sleep(act.wait == null ? 700 : act.wait)
    }
    const probe = await c.send("Runtime.evaluate", { expression: "JSON.stringify({ dialog: !!document.querySelector('[role=dialog]'), popover: !!document.querySelector('[data-radix-popper-content-wrapper]'), dark: document.documentElement.classList.contains('dark'), title: document.title, url: location.pathname })", returnByValue: true })
    results.push({ shot: step.name, probe: probe.result && probe.result.result && probe.result.result.value })
    if (!step.skipScroll) await c.send("Runtime.evaluate", { expression: "window.scrollTo(0,0)" })
    await sleep(300)
    let params = step.clip ? { format: "png", clip: Object.assign({ scale: 1 }, step.clip) } : { format: "png", captureBeyondViewport: true }
    if (step.fullPage) {
      const lm = await c.send("Page.getLayoutMetrics")
      const cs = lm.result.cssContentSize
      params = { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(cs.width), height: Math.min(Math.ceil(cs.height), 6000), scale: 1 } }
    }
    const shot = await c.send("Page.captureScreenshot", params)
    if (!shot.result || !shot.result.data) { results.push({ shot: step.name, error: "no image", detail: JSON.stringify(shot).slice(0, 200) }); continue }
    const out = join(plan.outDir, step.name + ".png")
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, Buffer.from(shot.result.data, "base64"))
    results.push({ shot: step.name, path: out, bytes: Buffer.byteLength(shot.result.data, "base64") })
  }
  console.log("@@RESULT@@" + JSON.stringify({ ok: true, results }))
  try { chrome.kill() } catch {}
  process.exit(0)
}

main().catch((e) => { console.log("@@RESULT@@" + JSON.stringify({ ok: false, error: String(e && e.stack || e) })); try { chrome.kill() } catch {}; process.exit(1) })