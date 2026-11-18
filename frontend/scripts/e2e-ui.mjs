import { chromium } from 'playwright-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:5173'
const FENCE = String.fromCharCode(96).repeat(3)
const results = []
const failures = []

function check(name, pass, detail) {
  results.push({ name, pass: Boolean(pass), detail })
  if (!pass) failures.push(name + ' :: ' + (detail || ''))
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' :: ' + detail : ''))
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN', acceptDownloads: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

async function apiJSON(path, init) {
  const raw = await page.evaluate(async ({ p, i }) => {
    const r = await fetch(p, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, i || {}))
    const t = await r.text()
    return { status: r.status, text: t }
  }, { p: path, i: init || null })
  let body = null
  try { body = JSON.parse(raw.text) } catch { body = raw.text }
  return { status: raw.status, body }
}
const me = async () => { const b = (await apiJSON('/api/auth/me')).body; return b && b.user ? b.user : b }
const toastText = async () => {
  await page.waitForSelector('[data-sonner-toast]', { timeout: 6000 })
  return (await page.locator('[data-sonner-toast]').first().innerText()).replace(/\s+/g, ' ').trim()
}

const user = 'e2e' + String(Date.now()).slice(-6)
const pwd = 'e2e12345'
let articleId = null
const articleBody = '## 请求链路\n\nDispatcherServlet 拿到请求后，依次经过 HandlerMapping、HandlerAdapter 与 ViewResolver。\n\n' + FENCE + 'java\n@GetMapping("/hello")\npublic String hello() { return "hello"; }\n' + FENCE + '\n\n这就是一条最小可运行的链路。'
const articleBody2 = '## 请求链路（已编辑）\n\nDispatcherServlet 负责分发，HandlerMapping 负责找到控制器方法，ViewResolver 负责解析视图。\n\n' + FENCE + 'java\n@GetMapping("/hello")\npublic String hello() { return "hello"; }\n' + FENCE + '\n\n编辑已保存。'

try {
  await page.goto(BASE + '/register', { waitUntil: 'networkidle' })
  await page.fill('#username', user)
  await page.fill('#nickname', 'E2E 验证员')
  await page.fill('#password', pwd)
  await page.fill('#confirm', pwd)
  await page.locator('button[type=submit]').first().click()
  await page.waitForURL((u) => !u.pathname.startsWith('/register'), { timeout: 12000 })
  console.log('DBG url=' + page.url() + ' cookie=' + JSON.stringify(await page.context().cookies()) + ' header=' + (await page.locator('header').innerText()).replace(/\n+/g, '|').slice(0,80))
  const meRaw = await page.evaluate(async () => { const r = await fetch('/api/auth/me', { credentials: 'include' }); return { s: r.status, t: (await r.text()).slice(0, 200) } })
  console.log('DBG me=' + JSON.stringify(meRaw))
  const m0 = await me()
  check('注册后自动登录且积分为 0', m0 && m0.points === 0, JSON.stringify(m0 && { user: m0.username, points: m0.points }))

  await page.goto(BASE + '/resources/2', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.body.innerText.includes('当前余额'), null, { timeout: 10000 })
  await page.waitForTimeout(400)
  const resText = await page.locator('body').innerText()
  check('0 分时兑换入口给出差额提示', /还差 5 分/.test(resText), resText.split('\n').filter((l) => /还差|余额/.test(l)).join(' | ').slice(0, 80))
  const blocked = await apiJSON('/api/resources/2/exchange', { method: 'POST', body: '{}' })
  const m1 = await me()
  check('积分不足兑换被后端拒绝', blocked.status === 400 && blocked.body && blocked.body.code === 'POINTS_NOT_ENOUGH' && m1.points === 0, 'status=' + blocked.status + ' points=' + m1.points)

  await page.goto(BASE + '/articles/new', { waitUntil: 'networkidle' })
  await page.fill('#article-title', 'E2E 验证：Spring MVC 请求链路复盘')
  await page.selectOption('#article-section', { label: 'Java 后端' })
  await page.fill('#article-content', articleBody)
  await page.getByRole('button', { name: /发布文章/ }).click()
  await page.waitForURL(/\/articles\/\d+/, { timeout: 12000 })
  articleId = Number(page.url().match(/\/articles\/(\d+)/)[1])
  const m2 = await me()
  check('首次发布文章 +5', m2.points === 5, 'points=' + m2.points + ' article=' + articleId)

  await page.goto(BASE + '/articles/' + articleId + '/edit', { waitUntil: 'networkidle' })
  await page.fill('#article-content', articleBody2)
  await page.getByRole('button', { name: /保存修改/ }).click()
  await page.waitForURL(new RegExp('/articles/' + articleId + '$'), { timeout: 12000 })
  await page.waitForTimeout(600)
  const m3 = await me()
  check('编辑文章不加分', m3.points === 5, 'points=' + m3.points)

  await page.goto(BASE + '/articles/new', { waitUntil: 'networkidle' })
  await page.fill('#article-title', '草稿恢复测试标题')
  await page.fill('#article-content', '这是草稿恢复测试的正文，用来验证 1.2 秒防抖自动保存与刷新后恢复。')
  await page.waitForTimeout(2200)
  const savedHint = await page.locator('body').innerText()
  check('草稿自动保存提示出现', /草稿已保存/.test(savedHint), '')
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const titleVal = await page.inputValue('#article-title')
  const contentVal = await page.inputValue('#article-content')
  check('刷新后草稿恢复', titleVal === '草稿恢复测试标题' && contentVal.includes('草稿恢复测试的正文'), 'title=' + titleVal)
  const draftAfter = await apiJSON('/api/drafts?draftType=article&draftKey=new')
  check('草稿接口返回本人草稿', draftAfter.status === 200 && draftAfter.body && draftAfter.body.draftKey === 'new', 'status=' + draftAfter.status)
  await page.goto(BASE + '/qa/2', { waitUntil: 'networkidle' })
  await page.fill('textarea', '先看 DispatcherServlet 的分发链路，再确认 HandlerMapping 是否注册了对应路径；用 @RequestMapping 的 value 与请求方法逐一对照，最后看日志里 mapped handler。')
  await page.getByRole('button', { name: /提交回答/ }).click()
  const t5 = await toastText()
  const m5 = await me()
  check('回答问题 +3', m5.points === 8, 'points=' + m5.points + ' toast=' + t5)

  await page.goto(BASE + '/resources/1', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /兑换资料/ }).click()
  await page.getByRole('button', { name: /确认兑换/ }).click()
  await page.waitForTimeout(2200)
  const ownedText = await page.locator('body').innerText()
  const m6 = await me()
  check('兑换成功后余额 8 → 3', m6.points === 3, 'points=' + m6.points)
  check('兑换后页面出现已兑换与下载入口', /已兑换/.test(ownedText) && /下载文件/.test(ownedText), '')

  const dup = await apiJSON('/api/resources/1/exchange', { method: 'POST', body: '{}' })
  const m7 = await me()
  check('重复兑换幂等且不扣分', m7.points === 3 && dup.status === 200 && dup.body && dup.body.owned === true, 'status=' + dup.status + ' points=' + m7.points)
  const dl = await page.evaluate(async () => {
    const r = await fetch('/api/resources/1/download', { credentials: 'include' })
    const b = await r.blob()
    return { status: r.status, size: b.size }
  })
  check('已兑换资源可下载', dl.status === 200 && dl.size > 500, JSON.stringify(dl))
  const dlAgain = await page.evaluate(async () => {
    const r = await fetch('/api/resources/1/download', { credentials: 'include' })
    return { status: r.status }
  })
  const m7b = await me()
  check('重复下载不再扣分', dlAgain.status === 200 && m7b.points === 3, 'points=' + m7b.points)

  const denied = await page.evaluate(async () => {
    const r = await fetch('/api/resources/2/download', { credentials: 'include' })
    return { status: r.status }
  })
  check('未兑换资源拒绝下载', denied.status === 403, JSON.stringify(denied))

  await page.goto(BASE + '/articles/' + articleId, { waitUntil: 'networkidle' })
  await page.locator('button[aria-label="收藏"]').first().click()
  await page.waitForTimeout(900)
  const pressed = await page.locator('button[aria-label="取消收藏"]').count()
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const pressedAfter = await page.locator('button[aria-label="取消收藏"]').count()
  check('收藏状态跨刷新保留', pressed > 0 && pressedAfter > 0, 'before=' + pressed + ' after=' + pressedAfter)
  const fav = await apiJSON('/api/favorites')
  const favText = JSON.stringify(fav.body)
  check('个人中心收藏接口包含该文章', /article/.test(favText) && favText.indexOf(String(articleId)) >= 0, 'status=' + fav.status)

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.keyboard.press('Control+k')
  await page.waitForSelector('[role=dialog]', { timeout: 5000 })
  await page.keyboard.type('MyBatis', { delay: 30 })
  await page.waitForTimeout(1800)
  const dialogText = await page.locator('[role=dialog]').innerText()
  check('Ctrl+K 打开搜索并出结果', /MyBatis/.test(dialogText), dialogText.split('\n').slice(0, 6).join(' | ').slice(0, 160))
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1400)
  check('方向键 + Enter 打开结果', page.url() !== BASE + '/', page.url())
  const dialogGone = await page.locator('[role=dialog]').count()
  check('搜索面板已关闭', dialogGone === 0, 'dialogs=' + dialogGone)

  const qTitle = 'E2E 验证：MyBatis 动态 SQL 的 if 标签不生效怎么排查？'
  const q = await apiJSON('/api/questions', { method: 'POST', body: JSON.stringify({ title: qTitle, sectionId: 2, contentMd: '我在 mapper.xml 里写了 if 标签，但 SQL 里没有拼上条件，参数也传了。想请人帮我梳理排查顺序。' }) })
  const mq = await me()
  check('创建问题不改变积分', mq.points === 3 && q.status < 300, 'status=' + q.status + ' points=' + mq.points)
  const qid = q.body && q.body.id ? q.body.id : null
  if (qid) {
    const login = await apiJSON('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'alice', password: 'alice1234' }) })
    check('切换 alice 登录用于回答', login.status === 200, 'status=' + login.status)
    const ans = await apiJSON('/api/questions/' + qid + '/answers', { method: 'POST', body: JSON.stringify({ contentMd: '先看 if 的 test 是不是用了 and 连接却没写 where 标签；再看参数名与 @Param 是否一致，最后打开 MyBatis 的 SQL 日志确认拼出来的语句。' }) })
    check('alice 提交回答并加分', ans.status < 300, 'status=' + ans.status + ' body=' + JSON.stringify(ans.body).slice(0, 100))
    check('回答奖励 +3 及时到账', ans.body && ans.body.pointsDelta === 3, 'delta=' + (ans.body && ans.body.pointsDelta))
    const answerId = ans.body && (ans.body.answerId || ans.body.id)
    await apiJSON('/api/auth/logout', { method: 'POST' })
    await apiJSON('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: user, password: pwd }) })
    const accept = await apiJSON('/api/questions/' + qid + '/accept', { method: 'POST', body: JSON.stringify({ answerId }) })
    check('提问者采纳回答', accept.status < 300, 'status=' + accept.status + ' body=' + JSON.stringify(accept.body).slice(0, 120))
    const detail = await apiJSON('/api/questions/' + qid)
    check('问题标记已解决', detail.body && detail.body.solved === true, JSON.stringify(detail.body && { solved: detail.body.solved }))
    await page.goto(BASE + '/qa/' + qid, { waitUntil: 'networkidle' })
    const qText = await page.locator('body').innerText()
    check('详情页展示已解决与采纳', /已解决/.test(qText) && /采纳/.test(qText), '')
  }

  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true, locale: 'zh-CN' })
  const mp = await mctx.newPage()
  await mp.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await mp.fill('#username', 'alice')
  await mp.fill('#password', 'alice1234')
  await mp.locator('button[type=submit]').first().click()
  await mp.waitForTimeout(1800)
  await mp.goto(BASE + '/resources/2', { waitUntil: 'networkidle' })
  const mtext = await mp.locator('body').innerText()
  check('手机端已登录并看到兑换入口', /兑换资料/.test(mtext), mtext.slice(0, 60).replace(/\n/g, ' '))
  const navCount = await mp.locator('nav').count()
  check('手机端底部导航存在', navCount > 0, 'navs=' + navCount)
  await mp.getByRole('button', { name: /兑换资料/ }).click()
  await mp.getByRole('button', { name: /确认兑换/ }).click()
  await mp.waitForTimeout(2200)
  const mtext2 = await mp.locator('body').innerText()
  check('手机端兑换成功出现下载入口', /已兑换/.test(mtext2) && /下载文件/.test(mtext2), '')
  const dlEvent = mp.waitForEvent('download', { timeout: 12000 }).catch(() => null)
  await mp.getByRole('link', { name: /下载文件/ }).click()
  const file = await dlEvent
  check('手机端点击下载触发文件下载', Boolean(file), file ? file.suggestedFilename() : 'no download event')
  await mctx.close()
} catch (error) {
  check('脚本执行未抛异常', false, String(error && error.stack ? error.stack.split('\n').slice(0, 4).join(' | ') : error))
} finally {
  if (errors.length) console.log('PAGE_ERRORS ' + JSON.stringify(errors.slice(0, 5)))
  console.log('SUMMARY ' + JSON.stringify({ total: results.length, failed: failures.length, failures, user, articleId }))
  await browser.close()
}