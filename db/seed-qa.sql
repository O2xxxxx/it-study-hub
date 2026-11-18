-- ============================================================
--  IT 学习天地 · 演示问答（在 db/seed-content.sql 之后执行）
-- ============================================================
USE itstudy;
SET NAMES utf8mb4;

INSERT INTO question (id, section_id, author_id, title, content_md, answer_count, accepted_answer_id, solved, view_count, created_at, updated_at) VALUES
(1, 1, 3, 'Spring Boot 3 升级后 @Autowired 报 NoSuchBeanDefinition，怎么排查？',
 '把 Spring Boot 2.7 的项目升到 3.2，编译能过，一启动就炸：

```
NoSuchBeanDefinitionException: No qualifying bean of type
''com.example.demo.service.MailService'' available
```

类上明明写了 `@Service`。是不是 Boot 3 改了扫描规则？',
 2, 2, 1, 412, '2026-09-25 09:40:00', '2026-09-25 12:10:00'),

(2, 2, 2, 'MyBatis-Plus 分页插件和自定义 SQL 一起用，count 语句总是全表扫描',
 '自定义了一个带 `LEFT JOIN` 的列表查询，分页插件自动生成的 count 语句把 join 也带上了，几十万行数据慢到 8 秒。有没有办法只对主表 count？',
 1, NULL, 0, 233, '2026-09-30 14:22:00', '2026-10-02 08:20:00'),

(3, 2, 3, '唯一索引插入重复数据报 1062，但在并发下仍然插入了两条，为什么？',
 '表上建了 `UNIQUE KEY (user_id, resource_id)`，代码是「先查有没有记录，没有就 insert」。压测时偶尔出现两条一模一样的记录，而且没有报 1062。',
 2, 5, 1, 388, '2026-09-28 20:15:00', '2026-09-29 20:40:00'),

(4, 3, 3, 'React 18 里 useEffect 执行两次是 bug 吗？',
 '开发环境打开页面，接口被请求了两次，控制台 `console.log` 也打了两次。生产构建就没问题。',
 1, NULL, 0, 176, '2026-10-01 21:05:00', '2026-10-01 22:50:00'),

(5, 1, 2, 'Java 里 CompletableFuture 的 exceptionally 为什么没捕获到异常？',
 '`thenApply` 里抛出的异常，用 `exceptionally` 接不住，最后直接变成未处理的 CompletionException。是我链式调用写错了吗？',
 0, NULL, 0, 96, '2026-10-04 10:12:00', '2026-10-04 10:12:00');

INSERT INTO answer (id, question_id, author_id, content_md, is_accepted, created_at) VALUES
(1, 1, 1,
 '先按顺序排除三件事：

1. **包路径**：`@SpringBootApplication` 所在包的**子包**才会被扫到。你的 `MailService` 是不是在兄弟模块里？跨模块要显式 `@ComponentScan`。
2. **条件注解**：类上有没有 `@ConditionalOnProperty` 之类，条件不满足时 Bean 根本不会注册。
3. **构造器循环依赖**：Boot 3 默认禁止循环引用（`spring.main.allow-circular-references=false`），A→B→A 会直接启动失败。

最快的定位方式是启动时加 ```--debug```（注意是两个短横线），或者在测试里注入 `ApplicationContext` 打印所有 Bean 名字：

```java
Arrays.stream(ctx.getBeanDefinitionNames())
     .filter(n -> n.toLowerCase().contains("mail"))
     .forEach(System.out::println);
```

一个 Bean 都没有 → 扫描/条件问题；有 Bean 但类型不对 → 接口实现类没加 `@Service`。',
 0, '2026-09-25 11:20:00'),

(2, 1, 2,
 '补充一个我踩过的：Boot 3 把 `javax.*` 全换成了 `jakarta.*`。如果你某个依赖还是 javax 版本，它的 `@Service` 是 `javax.annotation` 体系的，Boot 3 根本不认，**不报错、也不注册**，表现就是 NoSuchBeanDefinition。

排查：`mvn dependency:tree | grep javax`，把老依赖换成 jakarta 版本。',
 1, '2026-09-25 12:02:00'),

(3, 2, 1,
 '两种做法：

**一、写自定义 count 语句**（推荐）

```java
// Mapper 里给同名方法加 Count 后缀的 id
IPage<ArticleVO> selectPage(IPage<?> page, @Param("q") Query q);
long selectPageCount(@Param("q") Query q); // 只 count 主表
```

然后自己算 total 塞进 `page.setTotal(...)`，关掉插件的自动 count：

```java
Page<ArticleVO> page = new Page<>(current, size);
page.setSearchCount(false);
```

**二、让 join 不放大行数**

如果 `LEFT JOIN` 的右表对一行左表最多一行（比如按主键 join），那 count 不会被放大，问题就只在「没走索引」。先看 `EXPLAIN` 的 rows 和 type。',
 0, '2026-10-02 08:15:00'),

(4, 3, 2,
 '因为「先查再插」中间有个时间窗：

- 线程 A 查到没有 → 
- 线程 B 查到没有 → 
- A insert 成功 → 
- B insert，**应该**报 1062。

如果 B 没报错还插进去了，说明你的唯一索引没生效。常见原因：表是 MyISAM（旧表迁移）、索引建在了一个前缀上（`UNIQUE KEY (name(10))` 只对前 10 个字符唯一）、或者字段排序规则不一样导致 ''ABC'' 和 ''abc'' 被当成同一个。

真正的修复不是「查一下再插」，而是**直接插，然后捕获 1062**。',
 0, '2026-09-29 20:31:00'),

(5, 3, 1,
 '答案是：把唯一约束当作**业务断言**，让数据库来挡，不要靠应用层判断。

```java
try {
    exchangeMapper.insert(record);      // 唯一键兜底
} catch (DuplicateKeyException e) {
    return ExchangeResult.alreadyOwned(); // 已经拥有，幂等返回
}
```

配合事务与「条件更新」扣分：

```sql
UPDATE app_user SET points = points - #{cost}
WHERE id = #{userId} AND points >= #{cost};
```

受影响行数为 0 就说明余额不足，直接回滚。这样即使两个请求同时进来：
- 只有一个能 INSERT 成功；
- 只有它能扣分、写流水；
- 另一个收到 1062，转成「已拥有」，余额不变。

**顺序很关键**：先 INSERT 兑换记录（占位），再扣分写流水，最后提交。反过来会先扣分再发现重复。',
 1, '2026-09-29 19:48:00'),

(6, 4, 2,
 '不是 bug，是 React 18 的 **StrictMode 双调用**在开发环境故意暴露副作用问题。

```jsx
<React.StrictMode><App /></React.StrictMode>
```

React 会 mount → unmount → mount 走一遍，验证你的 effect 是否能正确清理。生产构建不会重复。

正确做法：
1. 副作用要可重复执行（幂等）；
2. 请求要能取消：`AbortController` + cleanup 里 `abort()`；
3. 别用「第一次渲染才请求」这种 `useRef` 标志位绕过——那只是把 bug 藏起来。

```jsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(...);
  return () => ctrl.abort();
}, [url]);
```%%
'  ,
 0, '2026-10-01 22:40:00');
