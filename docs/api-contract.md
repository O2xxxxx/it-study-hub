# IT 学习天地 · 接口与数据契约（v1）

所有接口前缀 `/api`。前端 Vite 开发服务器代理 `/api` 与 `/files` 到 `http://localhost:8080`（同源部署时无需代理）。

## 0. 通用约定

- 会话：Spring Session（HttpSession + Cookie `ITSESSION`），登录后服务端 `SESSION.userId` 保存会员 id。前端用 `fetch` 带 `credentials: 'include'`。
- 成功响应体：直接返回业务数据（对象或数组），HTTP 200。
- 失败响应体统一为：
  ```json
  { "code": "POINTS_NOT_ENOUGH", "message": "积分不足，当前 3 分，需要 5 分", "details": { "balance": 3, "required": 5 } }
  ```
- 错误码与 HTTP 状态：
  | code | status | 含义 |
  | --- | --- | --- |
  | UNAUTHORIZED | 401 | 未登录，需登录后操作 |
  | FORBIDDEN | 403 | 已登录但无权限（非作者、非提问者） |
  | NOT_FOUND | 404 | 资源不存在 |
  | VALIDATION_ERROR | 400 | 参数校验失败，details.fieldErrors |
  | DUPLICATE_ANSWER | 409 | 同一问题重复回答 |
  | DUPLICATE_FAVORITE | 409 | 重复收藏（正常业务不出现，前端用幂等 toggle） |
  | POINTS_NOT_ENOUGH | 400 | 积分不足 |
  | ALREADY_EXCHANGED | 409 | 已兑换（后端返回 200 + owned=true 为主，此码仅并发兜底） |
  | NOT_EXCHANGED | 403 | 未兑换即下载 |
  | ALREADY_ACCEPTED | 409 | 该问题已采纳过回答 |
- 分页：`?page=1&size=10`（page 从 1 开始）。响应
  ```json
  { "items": [ ... ], "page": 1, "size": 10, "total": 23, "totalPages": 3 }
  ```

## 1. 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/auth/register | body: { username, password, nickname } 用户名 3-20 位字母数字下划线，密码 6-32 位。重复返回 409 DUPLICATE_USERNAME |
| POST | /api/auth/login | body: { username, password }，失败 401 |
| POST | /api/auth/logout | 关闭会话 |
| GET | /api/auth/me | 未登录返回 { authenticated: false }；登录返回见下 |

```json
{
  "authenticated": true,
  "user": { "id": 5, "username": "demo", "nickname": "演示同学", "avatarHue": 195, "points": 8, "createdAt": "2026-10-01 10:00:00" }
}
```

## 2. 版块

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/sections | 全部版块，含统计 { id, code, name, tagline, description, icon, accent, sortOrder, articleCount, questionCount, resourceCount } |
| GET | /api/sections/{code} | 单版块，code 为 java/database/frontend |

## 3. 文章

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/articles | query: sectionCode, page, size, sort=latest/hot, authorId。返回分页卡片 { id, title, summary, sectionId, sectionCode, sectionName, authorId, authorName, authorAvatarHue, rewardGranted, viewCount, createdAt, favorite } |
| GET | /api/articles/{id} | 详情，见下 |
| POST | /api/articles | 登录，body { title, sectionId, summary?, contentMd }，成功 201 返回 { id, pointsDelta, balance } |
| PUT | /api/articles/{id} | 登录 + 作者本人，body 同上，返回 { id }，积分不变 |
| DELETE | /api/articles/{id} | 登录 + 作者本人（可选实现） |

文章详情：
```json
{
  "id": 1, "title": "...", "summary": "...", "contentMd": "...", "contentHtml": "<p>已清洗的 HTML</p>",
  "section": { "id": 1, "code": "java", "name": "Java 后端", "accent": "coffee" },
  "author": { "id": 1, "nickname": "陈知行", "avatarHue": 210 },
  "rewardGranted": true, "viewCount": 42, "createdAt": "...", "updatedAt": "...",
  "favorite": false, "canEdit": false
}
```

## 4. 问答

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/questions | query: sectionCode, page, size, filter=all/unsolved/solved |
| GET | /api/questions/{id} | 详情：question + answers[] + canAccept + myAnswerId |
| POST | /api/questions | 登录，body { title, sectionId, contentMd }（不加分） |
| POST | /api/questions/{id}/answers | 登录，body { contentMd }，成功 201 { id, pointsDelta: 3, balance }；重复 409 DUPLICATE_ANSWER；回答自己的问题 400 |
| POST | /api/questions/{id}/accept | 登录 + 提问者本人，body { answerId }，返回 { questionId, acceptedAnswerId, solved: true }；与积分无关 |
| DELETE | /api/questions/{id}/accept | 取消采纳（可选） |

问题详情：
```json
{
  "id": 1, "title": "...", "contentMd": "...", "contentHtml": "...", "solved": true,
  "section": {...}, "author": {...},
  "answerCount": 2, "acceptedAnswerId": 2, "viewCount": 30, "createdAt": "...",
  "favorite": false, "canAccept": true, "canAnswer": true, "myAnswerId": null,
  "answers": [ { "id": 2, "contentMd": "...", "contentHtml": "...", "author": {...}, "accepted": true, "createdAt": "...", "isMine": false } ]
}
```

## 5. 资源

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/resources | query: sectionCode, page, size。每项 { id, title, description, fileType, fileSize, points, downloadCount, sectionId, sectionCode, sectionName, owned, canDownload } |
| GET | /api/resources/{id} | 详情（未登录也可看简介），含 owned=false |
| POST | /api/resources/{id}/exchange | 登录。首次成功 200 { owned: true, pointsDelta: -5, balance: 8, exchangeId }；已兑换 200 { owned: true, pointsDelta: 0, balance: 8, alreadyOwned: true }；不足 400 POINTS_NOT_ENOUGH |
| GET | /api/resources/{id}/download | 登录 + 已兑换，返回文件流 Content-Disposition: attachment。未登录 401，未兑换 403 |

## 6. 积分中心

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/points | { balance, earned, spent, logs[], exchanges[] } |
| GET | /api/points/logs | query: page,size，分页流水 |

```json
{
  "balance": 8, "earned": 13, "spent": 5,
  "logs": [ { "id": 15, "changeAmount": 3, "balanceAfter": 8, "reasonType": "ANSWER_REWARD", "reasonDesc": "回答问题《...》获得奖励", "refType": "answer", "refId": 7, "createdAt": "..." } ],
  "exchanges": [ { "id": 1, "resourceId": 1, "resourceTitle": "...", "fileType": "md", "pointsCost": 5, "createdAt": "..." } ]
}
```

reasonType 取值：ARTICLE_REWARD / ANSWER_REWARD / RESOURCE_EXCHANGE。

## 7. 全站搜索

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/search | query: q（必填，≥1 字符，≤40）、type=all/article/question/resource、sectionCode、limit（默认 8，最大 20） |

```json
{
  "keyword": "索引", "total": 3, "elapsedMs": 12,
  "groups": [
    { "type": "article", "label": "文章", "items": [ { "id": 4, "type": "article", "title": "...", "summary": "...", "sectionCode": "database", "sectionName": "数据库", "snippet": "...<mark>索引</mark>...", "meta": "陈知行 · 2026-10-02" } ] },
    { "type": "question", "label": "问答", "items": [ ... ] },
    { "type": "resource", "label": "资源", "items": [ ... ] }
  ]
}
```
snippet 已做 HTML 转义后再插入 mark 标签，前端可直接 dangerouslySetInnerHTML（仅限该字段）。

## 8. 收藏

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/favorites | query: type=all/article/question/resource。返回 { article: [...], question: [...], resource: [...] }，每项含目标标题、版块、时间、favorited: true |
| POST | /api/favorites/toggle | 登录，body { targetType, targetId }，返回 { favorited: true/false, count } 幂等 |

## 9. 草稿

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/drafts?draftType=article&draftKey=new | 返回草稿或 null（登录后、按 userId 隔离） |
| PUT | /api/drafts | 登录，body { draftType, draftKey, title?, sectionId?, contentMd }，upsert，返回 { updatedAt } |
| DELETE | /api/drafts?draftType=article&draftKey=12 | 删除（发布成功后调用） |

draftKey 规则：新建用 `new`，编辑用实体 id 字符串。draftType ∈ article/question。

## 10. 数据字段与权限总则

- `contentHtml` 由后端用 OWASP Java HTML Sanitizer 生成，白名单含 p/h1-h6/ul/ol/li/blockquote/pre/code/table/thead/tbody/tr/th/td/a/img/strong/em/del/hr/br，a 允许 href 且只允许 http/https/mailto。
- 所有写接口在 Controller 层校验会话；Service 层再校验归属（作者/提问者），两道防线。
- 积分余额一律从数据库读回，前端不使用本地推算值。
- 时间统一格式 `yyyy-MM-dd HH:mm:ss`，时区 Asia/Shanghai。
