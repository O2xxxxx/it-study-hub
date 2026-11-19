# 《IT 学习天地》课程设计材料

> 软件工程专业 2024 级 7 班 · JavaEE 应用开发 · 期末课程设计
> 本文件中的图使用 Mermaid 语法，可在 VS Code / Typora / GitHub / https://mermaid.live 直接渲染。

---

## 一、项目与文档组织结构

### 1.1 代码目录结构

```
JavaEE lastwork/
├── backend/                       Spring Boot 后端（Controller / Service / Mapper 三层）
│   ├── pom.xml                    JDK 17 + Spring Boot 3.5.16 + MyBatis-Plus 3.5.7
│   └── src/
│       ├── main/java/com/itstudy/
│       │   ├── ItStudyApplication.java
│       │   ├── controller/        REST 接口层：只做参数校验与调用 Service
│       │   ├── service/           业务层：积分事务、唯一约束兜底、权限判断
│       │   ├── mapper/            MyBatis-Plus Mapper 接口
│       │   ├── entity/            与表一一对应的实体
│       │   ├── dto/               出入参对象（不含密码等敏感字段）
│       │   ├── common/            统一返回、异常、错误码、登录注解
│       │   ├── config/            拦截器、参数解析器、存储与积分配置
│       │   └── util/              Markdown 清洗、分页、文本处理
│       ├── main/resources/
│       │   ├── application.yml    公共配置（端口、积分规则、资源目录）
│       │   └── application-dev.yml  本机数据库连接
│       └── test/java/com/itstudy/   后端测试（积分、并发、权限）
├── frontend/                      React + TS + Vite 前端
│   └── src/
│       ├── pages/                 14 个路由页面
│       ├── features/              search / markdown / editor / favorites / articles ...
│       ├── components/ui/         shadcn 风格基础组件（17 个）
│       ├── components/layout/     顶部导航、移动端底部导航、页面容器
│       ├── lib/                   api.ts / types.ts / motion.ts / utils.ts
│       └── styles/index.css       主题变量 + 玻璃材质 + 代码高亮
├── db/
│   ├── schema.sql                 建库建表（可重复执行）
│   ├── seed.sql                   版块与会员初始数据
│   ├── seed-content.sql           文章 / 问题 / 回答 / 资源 / 积分流水
│   ├── seed-qa.sql                验收补充数据
│   └── reset-db.sh                一键重置数据库
├── resources-data/                受控资源目录（3 份原创资料，不对外静态暴露）
├── scripts/
│   ├── start-backend.sh
│   ├── start-frontend.sh
│   └── acceptance.sh              11 组端到端验收脚本
├── docs/
│   ├── api-contract.md            接口与数据约定
│   ├── course-design.md           本文件（课程设计材料）
│   └── screenshots/               真实运行截图
└── README.md                      依赖、配置、启动、测试、演示
```

### 1.2 组织结构图

```mermaid
flowchart TD
    A["《IT 学习天地》项目"] --> B["后端 backend"]
    A --> C["前端 frontend"]
    A --> D["数据库 db"]
    A --> E["资料与脚本"]
    A --> F["文档 docs"]

    B --> B1["controller 接口层"]
    B --> B2["service 业务层"]
    B --> B3["mapper 持久层"]
    B --> B4["entity / dto"]
    B --> B5["common 公共组件"]
    B --> B6["config 配置与拦截器"]

    C --> C1["pages 路由页面"]
    C --> C2["features 业务组件"]
    C --> C3["components/ui 基础组件"]
    C --> C4["components/layout 布局"]
    C --> C5["lib 接口与动画参数"]

    D --> D1["schema.sql 建表"]
    D --> D2["seed*.sql 演示数据"]

    E --> E1["resources-data 受控文件"]
    E --> E2["scripts 启动与验收脚本"]

    F --> F1["api-contract.md"]
    F --> F2["course-design.md"]
    F --> F3["screenshots 运行截图"]
```

---

## 二、功能模块图

```mermaid
flowchart LR
    U["会员 / 游客"] --> M1["会员与权限"]
    U --> M2["技术版块"]
    U --> M3["文章"]
    U --> M4["问答"]
    U --> M5["资源"]
    U --> M6["积分中心"]
    U --> M7["搜索与收藏"]
    U --> M8["用户主页与社交"]

    M1 --> M1a["注册（用户名唯一 / BCrypt）"]
    M1 --> M1b["登录 · 退出 · 会话"]
    M1 --> M1c["个人中心"]

    M2 --> M2a["Java 版块"]
    M2 --> M2b["数据库版块"]
    M2 --> M2c["Web 前端版块"]
    M2 --> M2d["版块内按类型筛选"]

    M3 --> M3a["发布文章 +5 分（首次）"]
    M3 --> M3b["编辑自己的文章（不加分）"]
    M3 --> M3c["Markdown 阅读与代码复制"]

    M4 --> M4a["提问（不加分）"]
    M4 --> M4b["回答 +3 分（同题限一条）"]
    M4 --> M4c["提问者采纳 → 已解决"]

    M5 --> M5a["资料简介（游客可见）"]
    M5 --> M5b["消耗 5 分兑换"]
    M5 --> M5c["兑换后下载 / 重复下载免费"]

    M6 --> M6a["余额"]
    M6 --> M6b["积分流水"]
    M6 --> M6c["已兑换资源"]

    M7 --> M7a["Ctrl/⌘+K 全站搜索"]
    M7 --> M7b["收藏与个人中心回看"]

    M8 --> M8a["公开主页与编辑昵称"]
    M8 --> M8b["点赞与取消点赞"]
    M8 --> M8c["关注和粉丝列表"]
```

---

## 三、数据库表结构

共 12 张表，使用 InnoDB。社交关系通过组合唯一索引控制重复写入，冗余计数和明细在同一事务内更新。

| 表名 | 作用 | 关键约束 |
| --- | --- | --- |
| app_user | 会员账号与积分余额 | uk_user_username 用户名唯一；ck_user_points_nonneg 余额非负 |
| section | 技术版块（Java / 数据库 / Web 前端） | uk_section_code 版块编码唯一 |
| article | 技术文章 | fk 版块与作者；reward_granted 标记首发布奖励是否已发 |
| question | 提问与采纳状态 | accepted_answer_id / solved 记录采纳 |
| answer | 回答 | uk_answer_question_author(question_id, author_id) 同题答主唯一 |
| resource | 可兑换资料 | ck_resource_points 所需积分必须大于 0 |
| resource_exchange | 兑换记录 | uk_exchange_user_resource(user_id, resource_id) 一人一资源一条 |
| point_log | 积分流水 | uk_point_log_business(user_id, reason_type, ref_id) 同业务不重复记账 |
| favorite | 收藏 | 会员、目标类型与目标 ID 唯一 |
| draft | 草稿 | (user_id, draft_type, draft_key) 唯一 |
| post_like | 文章与问答点赞 | uk_like_target(user_id, target_type, target_id)，目标类型 CHECK |
| user_follow | 用户关注 | uk_follow_pair(follower_id, followee_id)，禁止自关注 |

### 3.1 字段明细（节选核心表）

**app_user**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT UNSIGNED PK | 自增主键 |
| username | VARCHAR(32) NOT NULL | 登录名，唯一 |
| password_hash | VARCHAR(100) NOT NULL | BCrypt 散列，从不存明文 |
| nickname | VARCHAR(32) NOT NULL | 展示昵称 |
| points | INT NOT NULL DEFAULT 0 | 当前积分余额 |
| follower_count / following_count | INT UNSIGNED DEFAULT 0 | 粉丝及关注计数 |

**article**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| section_id | BIGINT UNSIGNED | 所属版块 |
| author_id | BIGINT UNSIGNED | 作者，编辑权限依据 |
| content_md | MEDIUMTEXT | Markdown 原文 |
| reward_granted | TINYINT(1) | 1 表示首次发布奖励已发放，编辑不会再加分 |

文章和问题的 like_count 均为 INT UNSIGNED NOT NULL DEFAULT 0。

| 社交表 | 字段 | 说明 |
| --- | --- | --- |
| post_like | id, user_id, target_type, target_id, created_at | BIGINT 主键和关系 ID，类型为 article 或 question，时间为 DATETIME |
| user_follow | id, follower_id, followee_id, created_at | BIGINT 主键和关系 ID，时间为 DATETIME |

关注明细保留历史用户 ID。另一端用户已注销时，目录显示「已注销用户」并保留该条关系。点赞目标在服务事务中校验。删除文章时同步清理文章点赞。

**answer**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| question_id | BIGINT UNSIGNED | 所属问题 |
| author_id | BIGINT UNSIGNED | 答主 |
| is_accepted | TINYINT(1) | 是否被采纳 |

**point_log**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| change_amount | INT | 正数增加，负数扣减 |
| balance_after | INT | 变动后余额快照，便于对账 |
| reason_type | VARCHAR(32) | ARTICLE_PUBLISH / ANSWER_REWARD / RESOURCE_EXCHANGE |
| ref_type / ref_id | VARCHAR | 关联业务，可跳转 |

### 3.2 ER 图

```mermaid
erDiagram
    APP_USER ||--o{ ARTICLE : "撰写"
    APP_USER ||--o{ QUESTION : "提问"
    APP_USER ||--o{ ANSWER : "回答"
    APP_USER ||--o{ RESOURCE : "上传"
    APP_USER ||--o{ POINT_LOG : "拥有流水"
    APP_USER ||--o{ RESOURCE_EXCHANGE : "兑换"
    APP_USER ||--o{ FAVORITE : "收藏"
    APP_USER ||--o{ DRAFT : "草稿"
    APP_USER ||..o{ POST_LIKE : "点赞者"
    ARTICLE o|..o{ POST_LIKE : "article 目标"
    QUESTION o|..o{ POST_LIKE : "question 目标"
    APP_USER ||..o{ USER_FOLLOW : "关注方"
    APP_USER ||..o{ USER_FOLLOW : "被关注方"


    SECTION ||--o{ ARTICLE : "归属"
    SECTION ||--o{ QUESTION : "归属"
    SECTION ||--o{ RESOURCE : "归属"

    QUESTION ||--o{ ANSWER : "包含"
    QUESTION ||--o| ANSWER : "采纳"
    RESOURCE ||--o{ RESOURCE_EXCHANGE : "被兑换"
    RESOURCE ||--o{ POINT_LOG : "关联"

    APP_USER {
        bigint id PK
        varchar username UK
        varchar password_hash
        int points
        int follower_count
        int following_count
    }
    ARTICLE {
        bigint id PK
        bigint section_id FK
        bigint author_id FK
        varchar title
        text content_md
        tinyint reward_granted
        int like_count
    }
    QUESTION {
        bigint id PK
        bigint author_id FK
        bigint accepted_answer_id
        tinyint solved
        int like_count
    }
    ANSWER {
        bigint id PK
        bigint question_id FK
        bigint author_id FK
        tinyint is_accepted
    }
    RESOURCE {
        bigint id PK
        bigint section_id FK
        varchar file_name
        int points
    }
    RESOURCE_EXCHANGE {
        bigint id PK
        bigint user_id FK
        bigint resource_id FK
        int points_cost
    }
    POST_LIKE {
        bigint id PK
        bigint user_id
        varchar target_type
        bigint target_id
        datetime created_at
    }
    USER_FOLLOW {
        bigint id PK
        bigint follower_id
        bigint followee_id
        datetime created_at
    }
    POINT_LOG {
        bigint id PK
        bigint user_id FK
        int change_amount
        int balance_after
        varchar reason_type
        bigint ref_id
    }
```

## 四、运行截图与说明

截图来自实际运行的前后端和 MySQL，采集脚本见 `scripts/shoot.mjs`。第 1–2 张和第 17–20 张来自本次优化后的隔离验证环境，第 3–16 张保留原业务演示。

界面统一使用一套 G2 圆角 token：8 / 12 / 16 / 20 / 999px，定义在 `frontend/src/styles/index.css` 的 `--radius-*` 变量里，`tailwind.config.ts` 把 `rounded-xs/sm/md/lg/xl/2xl/full` 全部映射到这些变量，业务代码不再写任意像素圆角。所有带圆角的元素都启用 `corner-shape: squircle`（连续曲率，Chrome 139+），不支持该属性时自动回退成普通圆角，尺寸与层级不变。

### 1. 首页（桌面端，亮色）

![首页](screenshots/01-home-desktop.png)

顶部是玻璃质感的全局导航与 `Ctrl K` 搜索入口；首屏直接给出搜索框、三个技术版块卡片，以及最新文章、热门问答、精选资源三块真实内容，游客无需登录即可阅读。

### 2. 版块页

![版块页](screenshots/02-sections-desktop.png)

版块内用 Tabs 在文章 / 问答 / 资源之间切换，选中指示器用 `layoutId` 做滑动过渡，筛选条件写入 URL，返回时保留。

### 3. 文章阅读页

![文章阅读页](screenshots/03-article-desktop.png)

正文限制行宽，标题层级清晰；代码块带高亮与「复制」按钮；右侧是版块与相关内容的玻璃侧栏。

### 4. 问答列表

![问答列表](screenshots/04-questions-desktop.png)

按全部 / 待解决 / 已解决筛选，卡片显示所属版块、回答数、浏览数与解决状态。

### 5. 问答详情与采纳结果

![已采纳回答](screenshots/05-question-accepted.png)

提问者采纳后问题标记为「已解决」，被采纳的回答在详情页顶部单独高亮，采纳与回答奖励相互独立。

### 6. 资源列表

![资源列表](screenshots/06-resources-desktop.png)

每份资源显示版块、文件类型、大小、兑换所需积分与已兑换状态。

### 7. 游客访问资源详情

![游客资源页](screenshots/07-resource-guest.png)

游客能看到简介与所需积分，兑换按钮替换为登录提示；直接请求下载接口会被后端以 401/403 拦截。

### 8. 兑换弹层（锚定在按钮附近）

![兑换弹层](screenshots/08-exchange-popover.png)

弹层从操作按钮旁展开，显示当前余额、兑换后余额与扣减分值，确认前先算清代价。

### 9. 兑换成功：余额与按钮原位过渡

![兑换成功](screenshots/09-exchanged-owned.png)

兑换成功后余额从 19 过渡到 14，按钮在同一位置切换为「已兑换 · 下载文件」，右下角 toast 明确写出「-5 积分，当前余额 14 分」。

### 10. 积分中心

![积分中心](screenshots/10-points-desktop.png)

余额、积分流水（增减分值、原因、时间、关联业务）与已兑换资源都取自服务端；流水按时间倒序，扣分与加分用不同颜色区分。

### 11. 个人中心

![个人中心](screenshots/11-profile-desktop.png)

积分摘要卡使用同一套玻璃材质，下方按类型展示收藏的文章、问题与资源，已兑换资源可直接回到下载入口。

### 12. 全局搜索面板

![搜索面板](screenshots/12-search-dialog.png)

`Ctrl/⌘ + K` 唤起，输入 MyBatis 后按类型分组返回 文章 / 问答 / 资源 共 3 条结果，方向键选择、回车打开、Esc 关闭；底部标注快捷键。

### 13. 暗色主题首页

![暗色首页](screenshots/13-home-dark.png)

暗色使用独立的一组颜色变量，正文、链接、边框、提示与代码高亮都单独校验过对比度，玻璃层在深色底上降低透明度避免发灰。

### 14. 移动端首页（390 × 844）

![移动端首页](screenshots/14-mobile-home.png)

窄屏保留搜索、版块入口与内容列表，底部切换为玻璃质感的移动导航，横向空间全部留给内容。

### 15. 移动端资源页与兑换

![移动端资源页](screenshots/15-mobile-resource.png)

移动端兑换弹层改为底部抽屉（Sheet），确认后在同一位置过渡到「已兑换 + 下载文件」。

### 16. 积分不足提示

![积分不足](screenshots/16-insufficient-points.png)

0 分账号点击兑换，后端返回 `400 POINTS_NOT_ENOUGH`，页面同时给出差额与赚分路径（写文章 +5、回答问题 +3）。

### 17. 本人主页（桌面端）

![本人主页](screenshots/17-profile-own.png)

本人可编辑昵称，查看积分摘要、内容、收藏和草稿。

### 18. 他人主页与关注入口

![他人主页](screenshots/18-profile-follow.png)

公开展示文章、回答、粉丝和关注数量，会员可以从此处关注作者。

### 19. 手机端用户主页（390 × 844）

![手机端用户主页](screenshots/19-profile-mobile.png)

暗色外观保留头像、关注按钮和底部五项导航。

### 20. 文章点赞态

![文章点赞态](screenshots/20-article-liked.png)

从文章作者进入主页。已点赞的心形呈蓝色实心，按钮和数量与列表同步。

### 21. 粉丝 / 关注弹层（居中玻璃面板）

![粉丝弹层](screenshots/21-followers-dialog.png)

粉丝与关注共用同一个居中 Dialog，不再从侧边抽出抽屉：标题、人数、成员列表和分页都收在 `glass-3` 面板内，与顶栏、全局搜索使用同一套描边、模糊和阴影；Esc 关闭后焦点回到「粉丝 3」入口，点击成员直接进入对方主页。暗色主题与 390 × 844 手机端已实测为同样的居中布局。

## 五、关键代码与说明

### 1. 文章首次发布加分（事务 + 幂等）

`backend/src/main/java/com/itstudy/service/impl/ArticleServiceImpl.java:117-141`

```java
@Override
@Transactional
public PublishResult publish(Long userId, ArticleForm form) {
    requireSection(form.getSectionId());
    Article article = new Article();
    article.setSectionId(form.getSectionId());
    article.setAuthorId(userId);
    article.setTitle(form.getTitle().trim());
    article.setContentMd(form.getContentMd());
    article.setRewardGranted(Boolean.TRUE);
    articleMapper.insert(article);

    int delta = PointAwarder.award(pointLogMapper, appUserMapper, userId,
            REASON_ARTICLE,
            "发布文章《" + article.getTitle() + "》获得奖励",
            "article",
            article.getId(),
            pointsProperties.getArticlePublish());
    return PublishResult.of(article.getId(), delta, balance(userId));
}
```

要点：插入文章与发放奖励在**同一个 `@Transactional` 方法**内，任一步失败整体回滚，不会出现「文章有了分没加」或「分了文章没落库」。
`PointAwarder.award` 先按 `(user_id, reason_type, ref_id)` 查重，再插入 `point_log`（表上有唯一约束兜底），最后 `UPDATE app_user SET points = points + ?`，重复提交只会返回 `delta = 0`。
编辑走 `update()`，该方法从不调用 `award`，所以「首次发布 +5、后续编辑不变」由代码路径本身保证，而不是靠前端状态。

### 2. 回答去重与加分（数据库唯一约束 + 捕获冲突）

`backend/src/main/java/com/itstudy/service/impl/QuestionServiceImpl.java:183-214`

```java
@Transactional
public AnswerResult answer(Long userId, Long questionId, AnswerForm form) {
    Question question = questionMapper.selectById(questionId);
    if (question == null) {
        throw BizException.notFound("问题不存在");
    }
    if (userId != null && userId.equals(question.getAuthorId())) {
        throw new BizException(ErrorCodes.CANNOT_ANSWER_OWN_QUESTION, HttpStatus.BAD_REQUEST, "不能回答自己的问题");
    }
    if (answerMapper.countByQuestionAndAuthor(questionId, userId) > 0) {
        throw BizException.conflict(ErrorCodes.DUPLICATE_ANSWER, "你已经回答过这个问题了");
    }
    Answer answer = new Answer();
    answer.setQuestionId(questionId);
    answer.setAuthorId(userId);
    answer.setContentMd(form.getContentMd());
    answer.setIsAccepted(Boolean.FALSE);
    try {
        answerMapper.insert(answer);
    } catch (DuplicateKeyException ex) {
        throw BizException.conflict(ErrorCodes.DUPLICATE_ANSWER, "你已经回答过这个问题了");
    }
    questionMapper.incrementAnswerCount(questionId);
    int delta = PointAwarder.award(pointLogMapper, appUserMapper, userId,
            REASON_ANSWER, "回答问题《" + question.getTitle() + "》获得奖励",
            "answer", answer.getId(), pointsProperties.getAnswerCreate());
    return AnswerResult.of(answer.getId(), delta, balance(userId));
}
```

要点：先做一次存在性检查给出友好提示，真正的并发防线是 `uk_answer_question_author (question_id, author_id)` 唯一索引——两个请求同时通过检查时，只有一个能插入成功，另一个拿到 `DuplicateKeyException` 并转成 `409 DUPLICATE_ANSWER`。
回答行插入、回答数自增、奖励流水与余额更新在同一事务内；「答主 + 问题」唯一，所以 `+3` 分不可能重复发放。提问走 `ask()`，只有插入与计数，没有 `award` 调用，因此提问不加分。

### 3. 资源兑换事务（先占坑、再扣分、失败回滚）

`backend/src/main/java/com/itstudy/service/impl/ResourceServiceImpl.java:78-119`

```java
@Override
@Transactional
public ExchangeResult exchange(Long id, Long userId) {
    Resource resource = resourceMapper.selectById(id);
    if (resource == null) {
        throw BizException.notFound("资源不存在");
    }
    ResourceExchange existed = exchangeMapper.selectByUserAndResource(userId, id);
    if (existed != null) {
        return alreadyOwned(existed.getId(), userId);
    }
    ResourceExchange exchange = new ResourceExchange();
    exchange.setUserId(userId);
    exchange.setResourceId(id);
    exchange.setPointsCost(resource.getPoints());
    try {
        exchangeMapper.insert(exchange);
    } catch (DuplicateKeyException ex) {
        ResourceExchange concurrent = exchangeMapper.selectByUserAndResource(userId, id);
        return alreadyOwned(concurrent == null ? null : concurrent.getId(), userId);
    }

    int cost = resource.getPoints() == null ? 0 : resource.getPoints();
    int rows = appUserMapper.deductPoints(userId, cost);
    if (rows == 0) {
        Integer balance = appUserMapper.selectBalance(userId);
        throw new BizException(ErrorCodes.POINTS_NOT_ENOUGH, HttpStatus.BAD_REQUEST,
                "积分不足，当前 " + balance + " 分，需要 " + cost + " 分", details);
    }
    PointAwarder.recordSpend(pointLogMapper, userId, cost,
            "兑换资源《" + resource.getTitle() + "》", "resource", exchange.getId(), latest);
    ...
}
```

要点：兑换记录先插入，靠 `uk_exchange_user_resource (user_id, resource_id)` 唯一索引抢占；并发请求中只有一个能插入，其余直接返回「已拥有」，不扣分。
扣分用条件更新 `UPDATE app_user SET points = points - ? WHERE id = ? AND points >= ?`，`rows = 0` 即余额不足，抛异常让事务回滚——刚插入的兑换记录一并撤销，所以不会出现「有兑换记录但没扣分」。
余额校验放在数据库条件里而不是先查后改，避免并发下的检查-使用竞态；扣分成功后才写 `point_log` 扣费流水，三者（余额、流水、兑换记录）在同一事务内保持一致。下载接口另有 `NOT_EXCHANGED` 校验，未兑换会员拿不到文件字节。

## 六、测试与验收结果

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 后端集成/单元测试 | `bash scripts/mvn.sh -f backend/pom.xml test` | 13 个测试类、37 项用例，`Failures: 0, Errors: 0` |
| 后端接口验收 | `bash scripts/acceptance.sh` | PASS 53 / FAIL 0 |
| 前端类型检查与构建 | `cd frontend && npx tsc --noEmit && npx vite build` | 均 exit 0 |
| 浏览器端到端 | `cd frontend && node scripts/e2e-ui.mjs` | 47 项断言全部通过 |

浏览器端到端覆盖了验收剧本的完整链路：注册 0 分 → 兑换被拒 → 发文 +5 → 答题 +3 → 兑换扣 5 → 下载 → 重复兑换/重复下载不扣分 → 未兑换下载 403 → 收藏跨刷新 → Ctrl+K 键盘搜索 → 草稿恢复 → 采纳 → 移动端兑换下载。新增场景覆盖关注与点赞跨刷新、取消点赞失败回滚、移动端主页及导航对齐、搜索和下载焦点。

## 七、答辩要点

1. **积分一致性怎么保证**：三个计分点各自是一个 `@Transactional` 方法；加分走「查重 → 写流水（唯一约束兜底）→ 更新余额」，扣分走「先插兑换记录（唯一约束抢锁）→ 条件更新扣余额」，任何一步失败整体回滚。
2. **并发与重复提交怎么防**：唯一索引是最终防线（`uk_answer_question_author`、`uk_exchange_user_resource`、`uk_point_log_business`），代码里的存在性检查只负责给出友好提示；扣分用 `WHERE points >= ?` 的条件更新，余额不可能为负。
3. **权限边界怎么划**：登录态存 HttpSession，`AuthInterceptor` 统一拦截写接口；内容修改按 `authorId` 比对，采纳按 `question.authorId` 比对，下载按兑换记录判定，前端隐藏按钮只是体验，后端才是判定点。