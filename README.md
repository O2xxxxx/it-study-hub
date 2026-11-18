# IT 学习天地 · 大学生中文技术学习社区

软件工程专业 2024 级 7 班《JavaEE 应用开发》期末课程设计。
后端 Spring Boot 3 + Spring MVC + MyBatis-Plus + MySQL 8，前端 React 18 + TypeScript + Vite + Tailwind CSS。

## 一、功能一览

| 模块 | 能力 |
| --- | --- |
| 会员与游客 | 注册（用户名唯一、BCrypt 散列、注册 0 分）、登录、退出、个人中心；游客只读公开内容 |
| 技术版块 | Java / 数据库 / Web 前端三个版块，版块内按文章、问答、资源分类浏览 |
| 文章 | 会员发布 Markdown 文章，首次发布 +5 分，编辑保持积分不变，作者可改自己的文章 |
| 问答 | 会员提问（不加分）、回答他人问题（+3 分，同题每人限一条）、提问者采纳并标记已解决 |
| 资源 | 展示简介与所需积分（默认 5 分），兑换后下载，重复下载免费，未兑换一律拦截 |
| 积分中心 | 余额、积分流水、已兑换资源，全部以服务端结果为准 |
| 全站搜索 | Ctrl/⌘ + K 唤起，文章/问题/资源统一检索，类型与版块筛选、键盘导航 |
| 收藏与回看 | 文章、问题、资源可收藏，个人中心分类查看，跨刷新保留 |
| 写作台 | 实时预览、代码高亮、草稿按账号与编辑对象隔离自动保存，发布后清理 |

## 二、环境依赖

- JDK 17（必须 17，JDK 22 会让 Lombok 编译失败）
- Maven 3.9+（本仓库自带 `.tools/apache-maven-3.9.9`）
- MySQL 8.0（本仓库自带便携版 `.tools/mysql-8.0.29-winx64`，端口 3307）
- Node.js 18+ 与 npm 10+（开发机使用 Node 24 / npm 11）

## 三、从空库到启动

### 1. 启动 MySQL（若本机未常驻）

```bash
.tools/mysql-8.0.29-winx64/bin/mysqld --defaults-file=.tools/my.ini --console
```

### 2. 初始化数据库（可重复执行，会重建 itstudy 库）

```bash
bash db/reset-db.sh
```

脚本依次执行 `db/schema.sql`、`db/seed.sql`、`db/seed-content.sql`、`db/seed-qa.sql`，并打印各表行数。演示账号密码见第六节。

### 3. 启动后端

```bash
bash scripts/start-backend.sh          # http://localhost:8080
```

数据库连接在 `backend/src/main/resources/application-dev.yml`，也可复制 `application-local.yml.example` 为 `application-local.yml` 覆盖。

### 4. 启动前端

```bash
bash scripts/start-frontend.sh         # http://localhost:5173
```

Vite 已配置代理：`/api` 与 `/files` 转发到 `http://localhost:8080`，开发时同源无跨域问题。

## 四、测试

```bash
# 1) 后端测试（10 个测试类 / 28 项用例，使用 itstudy_test 库）
bash scripts/refresh-test-db.sh          # 把种子数据同步到测试库（可重复）
bash scripts/mvn.sh -f backend/pom.xml test

# 2) 前端类型检查 + 生产构建
cd frontend && npx tsc --noEmit && npx vite build

# 3) 接口级验收（37 项断言，需后端已启动）
bash scripts/acceptance.sh http://localhost:8080

# 4) 浏览器端到端（31 项断言，真实 Chrome 无头驱动）
cd frontend && node scripts/e2e-ui.mjs
```

接口验收覆盖：游客拦截、注册 0 分、积分不足、发文 +5、编辑不加分、答题 +3、同题重复回答 409、兑换扣分、重复兑换/重复下载不扣分、未兑换下载 403、并发兑换只扣一次、搜索、草稿、收藏、采纳权限。
浏览器端到端覆盖完整演示剧本（含 Ctrl+K 键盘搜索、草稿刷新恢复、移动端兑换下载），截图脚本为 `scripts/shoot.mjs`。

## 五、配置项

| 配置 | 位置 | 说明 |
| --- | --- | --- |
| 端口 | `application.yml` | 默认 8080 |
| 数据库 | `application-dev.yml` | jdbc:mysql://127.0.0.1:3307/itstudy |
| 资源目录 | `app.storage.resource-dir` | 默认 `../resources-data`，受控目录不对外暴露 |
| 积分规则 | `app.points.*` | 文章 5 分、回答 3 分 |

## 六、演示账号

| 用户名 | 密码 | 初始积分 |
| --- | --- | --- |
| teacher | teach1234 | 19 |
| alice | alice1234 | 19 |
| bob | bob12345 | 10 |
| demo | demo1234 | 0（用于演示积分不足） |

## 七、文档

- `docs/api-contract.md` —— 接口与数据约定
- `docs/course-design.md` —— 组织结构图、功能模块图、表结构与 ER 图、截图与关键代码
- `docs/screenshots/` —— 16 张真实运行截图（桌面/移动、亮色/暗色、兑换弹层与积分不足）
- `scripts/shoot.mjs` —— 无头 Chrome + CDP 截图脚本（登录、切主题、真实鼠标键盘、局部裁剪）
- `frontend/scripts/e2e-ui.mjs` —— Playwright 浏览器端到端脚本