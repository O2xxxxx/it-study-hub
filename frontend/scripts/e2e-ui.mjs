import { chromium } from 'playwright-core'

const CHROME = process.env.ITSTUDY_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.ITSTUDY_WEB_ORIGIN ?? 'http://127.0.0.1:5173'
const FENCE = String.fromCharCode(96).repeat(3)
const results = []
const failures = []

function check(name, pass, detail) {
  results.push({ name, pass: Boolean(pass), detail })
  if (!pass) failures.push(name + ' :: ' + (detail || ''))
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' :: ' + detail : ''))
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  ignoreDefaultArgs: ['--hide-scrollbars'],
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
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
  const download = page.getByRole('link', { name: '下载文件' })
  check('兑换后焦点移到下载按钮', await download.evaluate(el => document.activeElement === el))

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
  const alignment = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="主导航"]').getBoundingClientRect()
    const group = document.querySelector('section[aria-label="技术版块"]').getBoundingClientRect()
    const footer = document.querySelector('footer > div').getBoundingClientRect()
    return Math.abs(nav.left + nav.width / 2 - innerWidth / 2) < 1 && Math.abs(group.left - footer.left) < 1
  })
  check('桌面导航居中且页脚与卡片共用左边线', alignment)
  const primaryNav = page.getByRole('navigation', { name: '主导航', exact: true })
  const navLeft = () => primaryNav.evaluate(nav => nav.getBoundingClientRect().left)
  const homeNavLeft = await navLeft()
  await primaryNav.getByRole('link', { name: '版块', exact: true }).click()
  await page.getByRole('heading', { name: '技术版块', level: 1, exact: true }).waitFor()
  check('长短页面切换时桌面导航位置一致', Math.abs(await navLeft() - homeNavLeft) < 1)
  await primaryNav.getByRole('link', { name: '首页', exact: true }).click()
  const searchTrigger = page.locator('#home-search')
  await searchTrigger.click()
  const searchPanel = page.getByRole('dialog', { name: '全站搜索' })
  await searchPanel.waitFor()
  await page.keyboard.press('Escape')
  await searchPanel.waitFor({ state: 'hidden' })
  check('搜索关闭后焦点回到首页搜索入口', await searchTrigger.evaluate(el => document.activeElement === el))
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
    check('alice 提交回答并加分', ans.status === 201 && ans.body?.pointsDelta === 3, 'status=' + ans.status + ' body=' + JSON.stringify(ans.body).slice(0, 100))
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

  const person = (await apiJSON('/api/users/teacher')).body
  await page.goto(BASE + '/articles/1', { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: person.nickname, exact: true }).click()
  await page.waitForURL(/\/u\/teacher$/)
  const profile = page.getByRole('region', { name: '用户资料' })
  await profile.getByRole('button', { name: '关注', exact: true }).click()
  await profile.getByRole('button', { name: '取消关注', exact: true }).waitFor()
  const afterFollow = (await apiJSON('/api/users/teacher')).body
  check('作者链接打开主页并关注后粉丝 +1', afterFollow.followerCount === person.followerCount + 1 && afterFollow.followedByMe, 'fans=' + afterFollow.followerCount)

  await page.reload({ waitUntil: 'networkidle' })
  await profile.getByRole('button', { name: '取消关注', exact: true }).waitFor()
  check('刷新后仍关注', await profile.getByRole('button', { name: '取消关注', exact: true }).getAttribute('aria-pressed') === 'true')
  const fans = profile.getByRole('button', { name: /^粉丝 / })
  await fans.click()
  const sheet = page.getByRole('dialog', { name: '粉丝' })
  await sheet.getByRole('link', { name: /E2E 验证员/ }).waitFor()
  const box = await sheet.boundingBox()
  const viewport = page.viewportSize()
  const centered = !!box && !!viewport
    && Math.abs(box.x + box.width / 2 - viewport.width / 2) < 12
    && box.height < viewport.height * 0.9
  check('粉丝弹层居中展示新关系（非侧边抽屉）', centered, box ? 'x=' + Math.round(box.x) + ' w=' + Math.round(box.width) + ' h=' + Math.round(box.height) : 'no box')
  await page.keyboard.press('Escape')
  await sheet.waitFor({ state: 'hidden' })
  check('粉丝弹层关闭后还原焦点', await fans.evaluate(el => document.activeElement === el))

  await page.goto(BASE + '/articles/1', { waitUntil: 'networkidle' })
  const beforeLike = (await apiJSON('/api/articles/1')).body.likeCount
  await page.getByRole('button', { name: '点赞', exact: true }).click()
  await page.getByRole('button', { name: '取消点赞', exact: true }).waitFor()
  await page.waitForFunction(async () => (await (await fetch('/api/articles/1')).json()).likedByMe)
  await page.reload({ waitUntil: 'networkidle' })
  const currentLike = page.getByRole('button', { name: '取消点赞', exact: true })
  await currentLike.waitFor()
  check('文章点赞刷新保留且计数 +1', Number(await currentLike.innerText()) === beforeLike + 1)
  await currentLike.click()
  await page.waitForFunction(async () => !(await (await fetch('/api/articles/1')).json()).likedByMe)
  check('取消点赞还原计数', Number(await page.getByRole('button', { name: '点赞', exact: true }).innerText()) === beforeLike)

  await page.getByRole('button', { name: '点赞', exact: true }).click()
  await page.waitForFunction(async () => (await (await fetch('/api/articles/1')).json()).likedByMe)
  let allowFailure
  const failureGate = new Promise(resolve => { allowFailure = resolve })
  const routed = '**/api/likes/toggle'
  await page.route(routed, async route => {
    await failureGate
    await route.fulfill({ status: 500, json: { code: 'INTERNAL_ERROR', message: '点赞更新失败' } })
  }, { times: 1 })
  await currentLike.click()
  check('取消点赞先乐观更新', await page.getByRole('button', { name: '点赞', exact: true }).getAttribute('aria-pressed') === 'false')
  allowFailure()
  await currentLike.waitFor()
  check('取消点赞失败时心形和计数回滚', await currentLike.getAttribute('aria-pressed') === 'true' && Number(await currentLike.innerText()) === beforeLike + 1)

  await page.getByRole('link', { name: person.nickname, exact: true }).click()
  await page.waitForURL(/\/u\/teacher$/)
  const articleLink = page.locator('a[href="/articles/1"].card-cover')
  await articleLink.waitFor()
  const sameCardLike = articleLink.locator('..').getByRole('button', { name: '取消点赞', exact: true })
  check('列表和文章详情共享点赞状态', await sameCardLike.getAttribute('aria-pressed') === 'true')
  await page.goto(BASE + '/me', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '编辑资料' }).click()
  await page.getByRole('textbox', { name: '昵称' }).fill('E2E 资料已更新')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByRole('heading', { name: 'E2E 资料已更新' }).waitFor()
  check('本人主页编辑资料', (await me()).nickname === 'E2E 资料已更新')

  const mobileViewport = { width: 390, height: 844 }
  const mctx = await browser.newContext({ viewport: mobileViewport, isMobile: true, hasTouch: true, acceptDownloads: true, locale: 'zh-CN' })
  const mp = await mctx.newPage()
  await mp.goto(BASE + '/login', { waitUntil: 'networkidle' })
  const mobileUser = user + 'm'
  const createMobile = await mctx.request.post(BASE + '/api/auth/register', {
    data: { username: mobileUser, nickname: '移动验收用户', password: pwd },
  })
  check('手机端验收使用独立账号', createMobile.status() === 201)
  await mctx.request.post(BASE + '/api/articles', {
    data: { title: '移动端验收积分准备', sectionId: 1, contentMd: '使用独立账号演示手机端资源兑换与下载。' },
  })
  await mp.fill('#username', mobileUser)
  await mp.fill('#password', pwd)
  await mp.locator('button[type=submit]').first().click()
  await mp.waitForURL(u => !u.pathname.startsWith('/login'))
  await mp.goto(BASE + '/', { waitUntil: 'networkidle' })
  const mobileNav = mp.getByRole('navigation', { name: '移动端主导航' })
  const navFitsScreen = () => mobileNav.evaluate((nav, viewport) => {
    const bounds = nav.getBoundingClientRect()
    return document.documentElement.scrollWidth <= viewport.width
      && Math.abs(bounds.width - viewport.width) < 1
      && Math.abs(bounds.bottom - viewport.height) < 1
  }, mobileViewport)
  const homeNavFits = await navFitsScreen()
  await mobileNav.getByRole('link', { name: '资源', exact: true }).tap()
  await mp.getByRole('heading', { name: '技术资料区', exact: true }).waitFor()
  await mp.locator('main a[href^="/resources/"]').first().waitFor()
  check('切换首页和资源区时底栏贴合手机视口', homeNavFits && await navFitsScreen())
  await mp.goto(BASE + '/u/bob', { waitUntil: 'networkidle' })
  const mobileProfile = mp.getByRole('region', { name: '用户资料' })
  await mobileProfile.getByRole('button', { name: '关注', exact: true }).click()
  await mobileProfile.getByRole('button', { name: '取消关注', exact: true }).waitFor()
  const mobileFit = await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  check('390×844 手机端主页可关注且没有横向溢出', mobileFit)
  const radius = await mp.locator('.control-rail').first().evaluate(rail => {
    const buttons = [...rail.querySelectorAll('button')]
    return parseFloat(getComputedStyle(rail).borderRadius) - parseFloat(getComputedStyle(buttons[0]).borderRadius) === 4
      && buttons.every(button => button.getBoundingClientRect().top === buttons[0].getBoundingClientRect().top)
  })
  check('手机端标签圆角按内外间距衔接且按钮同一基线', radius)
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
  check('浏览器没有未捕获异常', errors.length === 0, errors.slice(0, 5).join(' | '))
  console.log('SUMMARY ' + JSON.stringify({ total: results.length, failed: failures.length, failures, user, articleId }))
  await browser.close()
  process.exitCode = failures.length > 0 ? 1 : 0
}
