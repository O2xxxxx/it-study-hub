-- ============================================================
--  IT 学习天地 · 演示数据（在 db/schema.sql 之后执行）
--  种子账号密码：teacher/teach1234   alice/alice1234
--               bob/bob12345         demo/demo1234
-- ============================================================
USE itstudy;
SET NAMES utf8mb4;

-- 版块 ------------------------------------------------------
INSERT INTO section (id, code, name, tagline, description, icon, accent, sort_order) VALUES
 (1, 'java',     'Java 后端',  '从 Servlet 到 Spring Boot 的完整路径',
  '围绕 Spring / Spring MVC / MyBatis / JVM 构建后端能力：请求链路、依赖注入、事务边界、并发工具。适合准备秋招后端岗与课程设计答辩。',
  'Coffee', 'java', 1),
 (2, 'database', '数据库',    '索引、事务与 SQL 调优',
  'MySQL 8 的索引结构与执行计划、事务隔离与 MVCC、MyBatis 动态 SQL 与分页。写得出能跑的业务代码，也解释得清为什么这样跑得快。',
  'Database', 'db', 2),
 (3, 'frontend', 'Web 前端',  'React + TypeScript 工程实践',
  '组件化、状态管理、渲染性能与可访问性。从 useState 的批处理讲到 backdrop-filter 的合成层，把「看起来对」变成「量过才对」。',
  'Layout', 'web', 3);

-- 会员 ------------------------------------------------------
INSERT INTO app_user (id, username, password_hash, nickname, avatar_hue, points, created_at) VALUES
 (1, 'teacher', '$2b$10$XwBEHpLZPh5GxehjeR1PC.kNOnJBFitoRhU/6MrcXdKyoJ59nESgW', '陈知行', 210, 19, '2026-09-02 09:12:00'),
 (2, 'alice',   '$2b$10$jxjTUWccihrb33fa0UQy5u4Rz2ocNuUFV2.gwM9ZqVPsy7mZW9CYa', '阿鲤',   175, 19, '2026-09-05 14:40:00'),
 (3, 'bob',     '$2b$10$0XbxJ6NMoQ8fwV3GB9jZruS3q79Vl15Q/w.PQop8dDlTzVeOah7SW', '老周',    25, 10, '2026-09-11 20:05:00'),
 (4, 'demo',    '$2b$10$g/hTpBPPpsR67uXOJhpJ9ex5Hj.WSHMFFxCt9VH1VU4U.YP3hIfHm', '演示同学', 195, 0, '2026-10-01 08:00:00');

-- 资源 ------------------------------------------------------
INSERT INTO resource (id, section_id, uploader_id, title, description, file_name, file_type, file_size, points, download_count, created_at) VALUES
 (1, 1, 1, 'Spring MVC 请求处理全流程图解与速查表',
  '把 DispatcherServlet、HandlerMapping、HandlerAdapter、ViewResolver 串成一张图，附带 9 条拦截器与参数绑定的排错清单，以及课程设计答辩可直接复述的七步链路。原创整理，Markdown 排版。',
  'spring-mvc-request-flow.md', 'MD', 8420, 5, 6, '2026-09-20 10:20:00'),
 (2, 2, 2, 'MyBatis 动态 SQL 实战手册（18 个可运行片段）',
  'if / choose / trim / foreach / bind 全部配可运行片段，另含 ${} 与 #{} 的注入边界说明、批量插入的三种写法对比，以及分页 count 语句的坑。',
  'mybatis-dynamic-sql-handbook.md', 'MD', 9160, 5, 4, '2026-09-24 16:05:00'),
 (3, 2, 1, 'MySQL 8 索引与执行计划排错清单',
  '一张从「慢查询」到「加对索引」的检查清单：EXPLAIN 各列含义、最左前缀、回表与覆盖索引、隐式类型转换、以及用 FORCE INDEX 验证猜测的做法。纯文本，方便贴进笔记。',
  'mysql8-index-checklist.txt', 'TXT', 6210, 5, 3, '2026-09-28 09:30:00');

-- 积分流水（与上面的余额严格对应，答辩时可逐条讲解）--------
INSERT INTO point_log (user_id, change_amount, balance_after, reason_type, reason_desc, ref_type, ref_id, created_at) VALUES
 (1,  5,  5, 'ARTICLE_PUBLISH',  '首次发布文章《一次 HTTP 请求在 Spring MVC 里走过的七站》', 'article', 1, '2026-09-12 10:30:00'),
 (1,  5, 10, 'ARTICLE_PUBLISH',  '首次发布文章《别用字段注入了：构造器注入的三个理由》',     'article', 2, '2026-09-14 21:05:00'),
 (1,  5, 15, 'ARTICLE_PUBLISH',  '首次发布文章《MySQL 索引失效的六个真实场景》',             'article', 4, '2026-09-18 15:40:00'),
 (1,  3, 18, 'ANSWER_REWARD',    '回答《Spring Boot 3 升级后找不到 Bean 怎么排查》',        'answer',  1, '2026-09-25 11:20:00'),
 (1,  3, 21, 'ANSWER_REWARD',    '回答《唯一索引并发下仍然插入两条，为什么》',               'answer',  5, '2026-09-29 19:48:00'),
 (1,  3, 24, 'ANSWER_REWARD',    '回答《分页插件 count 语句全表扫描》',                      'answer',  3, '2026-10-02 08:15:00'),
 (1, -5, 19, 'RESOURCE_EXCHANGE','兑换资料《Spring MVC 请求处理全流程图解与速查表》',        'resource', 1, '2026-10-03 09:10:00'),

 (2,  5,  5, 'ARTICLE_PUBLISH',  '首次发布文章《从字节码看 ArrayList 扩容为什么是 1.5 倍》',  'article', 3, '2026-09-13 08:50:00'),
 (2,  5, 10, 'ARTICLE_PUBLISH',  '首次发布文章《CSS backdrop-filter 不卡的三条规则》',        'article', 8, '2026-09-19 13:10:00'),
 (2,  3, 13, 'ANSWER_REWARD',    '回答《Spring Boot 3 升级后找不到 Bean 怎么排查》',        'answer',  2, '2026-09-25 12:02:00'),
 (2,  3, 16, 'ANSWER_REWARD',    '回答《唯一索引并发下仍然插入两条，为什么》',               'answer',  4, '2026-09-29 20:31:00'),
 (2,  3, 19, 'ANSWER_REWARD',    '回答《React 18 里 useEffect 执行两次是 bug 吗》',          'answer',  6, '2026-10-01 22:40:00'),

 (3,  5,  5, 'ARTICLE_PUBLISH',  '首次发布文章《事务隔离级别与 MVCC：一次可重复读的实测》',   'article', 6, '2026-09-16 19:25:00'),
 (3,  5, 10, 'ARTICLE_PUBLISH',  '首次发布文章《React 状态更新为什么是异步批处理的》',       'article', 7, '2026-09-22 23:12:00');

-- 兑换记录（与积分流水一一对应）----------------------------
INSERT INTO resource_exchange (user_id, resource_id, points_cost, created_at) VALUES
 (1, 1, 5, '2026-10-03 09:10:00');

-- 收藏 ------------------------------------------------------
INSERT INTO favorite (user_id, target_type, target_id, created_at) VALUES
 (1, 'ARTICLE', 8, '2026-09-20 09:00:00'),
 (1, 'QUESTION', 2, '2026-09-30 09:00:00'),
 (2, 'ARTICLE', 1, '2026-09-21 09:00:00'),
 (2, 'RESOURCE', 3, '2026-09-30 09:00:00'),
 (3, 'ARTICLE', 5, '2026-09-26 09:00:00');
