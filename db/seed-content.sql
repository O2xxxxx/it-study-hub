-- ============================================================
--  IT 学习天地 · 演示内容（文章 / 问答），在 db/seed.sql 之后执行
-- ============================================================
USE itstudy;
SET NAMES utf8mb4;

INSERT INTO article (id, section_id, author_id, title, summary, content_md, reward_granted, view_count, created_at, updated_at) VALUES
(1, 1, 1, '一次 HTTP 请求在 Spring MVC 里走过的七站',
 '浏览器敲下回车，请求并不是直接掉进你的 @GetMapping。中间要经过七站，每一站都能成为你排查 404、415、参数为 null 的地方。',
 '# 一次 HTTP 请求在 Spring MVC 里走过的七站

浏览器敲下回车之后，请求并不是直接掉进你的 `@GetMapping` 里。Spring MVC 用一条固定的链路把「字符串路径」翻译成「方法调用」，这条链路有七站。

## 一、DispatcherServlet

它是前端控制器（Front Controller），所有请求的统一入口。在 Spring Boot 里由 `DispatcherServletAutoConfiguration` 自动注册，映射到 `/`。

```java
// Spring Boot 已经替你做了这件事
ServletRegistrationBean<DispatcherServlet> reg =
        new ServletRegistrationBean<>(new DispatcherServlet(ctx), "/");
```

## 二、HandlerMapping

拿着请求的 URL 去查「哪个方法负责它」。`RequestMappingHandlerMapping` 在启动时就把所有 `@RequestMapping` 解析成 `RequestMappingInfo`，运行时按路径、方法、参数条件匹配。

> 这一站查不到，就是 **404**：路径写错、类上少了 `@RestController`，或者被 `server.servlet.context-path` 加了前缀。

## 三、HandlerAdapter

找到方法后，需要有人负责「调用它并处理参数与返回值」。`RequestMappingHandlerAdapter` 会选择合适的 `HandlerMethodArgumentResolver` 把 `HttpServletRequest` 里的东西搬进方法参数。

```java
@PostMapping("/api/articles")
public Article create(@RequestBody CreateArticleRequest req) { ... }
```

`@RequestBody` 依赖 `HttpMessageConverter`，请求体不是合法 JSON 或 `Content-Type` 不是 `application/json` 就是 **415**。

## 四、拦截器

`HandlerInterceptor.preHandle` 在这一站执行。业务里「必须登录」的判断最适合放在这里：拒绝发生在进入方法之前，而不是每个方法里都写一遍。

## 五、Handler 方法体

你的业务代码。事务边界通常在这一层之下（Service 层），不要标在 Controller 上——Controller 里还混着参数解析，事务范围会失控。

## 六、返回值处理

带 `@ResponseBody` 时交给 `HttpMessageConverter` 序列化成 JSON；返回 `String` 又没有 `@ResponseBody` 时，会被当成视图名交给 `ViewResolver`。**这正是「方法明明返回了对象，浏览器却看到 404」的常见原因。**

## 七、视图渲染 / 响应写回

前后端分离项目里这一站直接写 JSON。此时如果抛出异常，`@RestControllerAdvice` 会兜住并转成统一错误结构。

## 一张速查表

| 现象 | 大概在哪一站 |
| --- | --- |
| 404，日志没进方法 | 二（HandlerMapping） |
| 415 Unsupported Media Type | 三（消息转换器） |
| 参数为 null | 三（参数解析器）或前端字段名不一致 |
| 事务没回滚 | 五（Service 层事务边界） |
| 返回对象却 404 | 六（被当成视图名） |

把这条链路记住，排查问题时就不是「猜」，而是「定位到站」。',
 1, 236, '2026-09-12 10:30:00', '2026-09-12 10:30:00'),

(2, 1, 1, '别用字段注入了：构造器注入的三个理由',
 '字段注入写起来最省事，但它让对象在构造完成后处于「半成品」状态。构造器注入不是为了好看，是为了让依赖关系在编译期就暴露出来。',
 '# 别用字段注入了：构造器注入的三个理由

## 写法对比

```java
// 字段注入：对象 new 出来时依赖是 null
@Service
public class ArticleService {
    @Autowired private ArticleMapper articleMapper;
}

// 构造器注入：不给你依赖，你连对象都造不出来
@Service
public class ArticleService {
    private final ArticleMapper articleMapper;
    public ArticleService(ArticleMapper articleMapper) {
        this.articleMapper = articleMapper;
    }
}
```

## 理由一：依赖不可变

`final` 字段只能在构造器里赋值，一旦赋值就不能被普通代码替换。多线程环境下这比「Spring 保证只注入一次」更可信。

## 理由二：脱离容器也能测

字段注入的单元测试必须启动 Spring 或者用反射塞值；构造器注入直接 `new ArticleService(mockMapper)` 就行。测试跑得快，你才会真的去跑。

## 理由三：循环依赖会当场暴露

字段注入下 A 依赖 B、B 依赖 A，Spring 会用三级缓存悄悄兜住——看起来能跑，实际是两个对象在构造完成前就互相持有引用。构造器注入会直接抛 `BeanCurrentlyInCreationException`，让你在启动阶段就发现设计问题。

## 一个例外

`@Value` 注入配置项用字段注入是可以接受的，因为它不是「协作对象」，只是常量。真正要避免的是把**服务依赖**写成字段。

> 结论：能用 `final` 描述的关系，就别用反射维护。',
 1, 188, '2026-09-14 21:05:00', '2026-09-15 09:20:00'),

(3, 1, 2, '从字节码看 Java 集合：ArrayList 扩容为什么是 1.5 倍',
 'new ArrayList<>(10) 并不会立刻分配 10 个格子。把 add 的字节码和 grow 方法摊开看，1.5 倍不是玄学。',
 '# 从字节码看 Java 集合：ArrayList 扩容为什么是 1.5 倍

## 先纠正一个直觉

```java
List<String> list = new ArrayList<>(10);
```

这行代码在 JDK 8+ 里**没有**创建长度为 10 的数组，只是记下容量为 10。真正的数组在第一次 `add` 时才分配（`DEFAULTCAPACITY_EMPTY_ELEMENTDATA` 的懒加载）。

## grow() 里的那句话

```java
private Object[] grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1); // 1.5 倍
    ...
}
```

`oldCapacity >> 1` 就是除以 2。相比「两倍扩容」，1.5 倍在**空间浪费**和**拷贝次数**之间取了个平衡：2 倍扩容长期平均浪费 50% 空间，1.5 倍约 33%，而拷贝次数只多对数级的一点点。

## 为什么不是 2 倍

假设容量序列是 1、2、4、8、16……需要第 17 个元素时，最后一次拷贝要搬 16 个。1.5 倍序列是 1、1、2、3、4、6、9、13……同样容量下每次拷贝规模更平缓，临时数组更小，GC 压力也更小。

## 实践建议

| 场景 | 建议 |
| --- | --- |
| 已知大概元素个数 | `new ArrayList<>(expected)`，避免多次拷贝 |
| 循环里批量 add | 先 `ensureCapacity` 或预估容量 |
| 需要频繁中间插入 | 换 `LinkedList` 或 `ArrayDeque` |
| 只读的固定集合 | `List.of(...)`，不可变且省内存 |

> 扩容的代价不只是 memcpy，还有「扩容瞬间产生的临时数组」带来的 GC 压力。',
 1, 154, '2026-09-13 08:50:00', '2026-09-13 08:50:00'),

(4, 2, 1, 'MySQL 索引失效的六个真实场景',
 '索引失效不是 MySQL 很笨，而是优化器算完代价后选择了别的路。逐条对照 EXPLAIN，前四个是你能立刻改的。',
 '# MySQL 索引失效的六个真实场景

## 一、对索引列做函数运算

```sql
-- 失效：created_at 上建了索引也没用
SELECT * FROM article WHERE DATE(created_at) = ''2026-09-12'';

-- 有效：把函数挪到常量侧
SELECT * FROM article
WHERE created_at >= ''2026-09-12 00:00:00''
  AND created_at <  ''2026-09-13 00:00:00'';
```

## 二、隐式类型转换

`username` 是 `VARCHAR`，你写 `WHERE username = 12345`。MySQL 会把**列**转成数字再比，索引直接作废。

## 三、最左前缀被跳过

联合索引 `(section_id, created_at)`，查询只带 `created_at`，用不上。把它想成「字典按拼音+页码排序」，你只报页码是没用的。

## 四、范围条件之后的条件

`WHERE section_id = 1 AND created_at > ''2026-01-01'' AND author_id = 2`，索引是 `(section_id, created_at, author_id)` 时，`author_id` 只能做过滤、不能继续走索引定位。

## 五、OR 连接了没有索引的列

只要 OR 的一侧没索引，整体就会退化成全表扫描（优化器偶尔用 index merge，但那也有代价）。

## 六、统计信息过旧

`ANALYZE TABLE` 之后执行计划变了？说明优化器对数据分布判断错了。大批量导入数据后记得补一次。

## 排查顺序

1. `EXPLAIN` 看 `type`，`ALL` 就是全表；
2. 看 `key` 是否为 `NULL`；
3. 用 `FORCE INDEX` 验证「如果走索引会不会更快」，验证完记得删掉；
4. 真的需要 `%keyword`，考虑改成前缀匹配或者上全文索引。

> 索引不是越多越好：每个索引都要在写入时维护，优化器选择也会变慢。',
 1, 302, '2026-09-18 15:40:00', '2026-09-18 15:40:00'),

(5, 2, 2, 'MyBatis 动态 SQL：if 之外你更该会的 trim 与 foreach',
 '动态 SQL 的坑八成在拼接：多一个 AND、少一个括号、IN 列表为空。用对标签能少写一半判断。',
 '# MyBatis 动态 SQL：if 之外你更该会的 trim 与 foreach

## 用 trim 处理前缀后缀

```xml
<select id="search" resultType="Article">
  SELECT id, title, summary
  FROM article
  <trim prefix="WHERE" prefixOverrides="AND |OR ">
    <if test="sectionId != null">AND section_id = #{sectionId}</if>
    <if test="keyword != null and keyword != ''''">
      AND title LIKE CONCAT(''%'', #{keyword}, ''%'')
    </if>
  </trim>
  ORDER BY created_at DESC
</select>
```

`prefixOverrides` 负责吃掉**第一个**多余的 `AND `，否则 `WHERE AND section_id = ?` 直接语法错误。

## foreach 之外的三个坑

- **列表为空**：`IN ()` 语法错误，调用方必须先判断非空；
- **超过一千项**：超大 `IN` 的解析成本陡增，分批更稳；
- **拼接注入**：`#{}` 是预编译占位符，`${}` 是字符串拼接。`ORDER BY ${sort}` 这种写法一定要用白名单校验。

## choose / when 比一堆 if 更易读

```xml
<choose>
  <when test="filter == ''solved''">AND q.solved = 1</when>
  <when test="filter == ''unsolved''">AND q.solved = 0</when>
  <otherwise/>
</choose>
```

## 分页 count 语句的坑

分页插件会自动把 `SELECT ...` 改写成 `SELECT COUNT(*)`。如果 SQL 里有 `ORDER BY` 或一对多的 `LEFT JOIN`，count 会被放大。解决办法是自己写 count 语句只查主表。

> 动态 SQL 的目标是「让 SQL 的合法性与业务条件同构」，不是把 Java 的 if 搬到 XML 里。',
 1, 141, '2026-09-24 16:05:00', '2026-09-24 16:05:00'),

(6, 2, 3, '事务隔离级别与 MVCC：一次可重复读的实测',
 '两个 session 打开，亲手验证 RR 下「读到的是旧版本」和「当前读能看到最新值」，比背八股清楚。',
 '# 事务隔离级别与 MVCC：一次可重复读的实测

## 准备

```sql
CREATE TABLE account (id INT PRIMARY KEY, balance INT NOT NULL);
INSERT INTO account VALUES (1, 100);
```

## 实验一：RR 下的快照读

| 时刻 | Session A（RR） | Session B |
| --- | --- | --- |
| t1 | BEGIN; SELECT balance FROM account WHERE id=1; → 100 | |
| t2 | | UPDATE account SET balance=200 WHERE id=1; |
| t3 | SELECT balance FROM account WHERE id=1; → **100** | |

A 看到 100，是因为 RR 在第一次一致性读时建立了 ReadView，之后的普通 SELECT 都复用它（快照读）。**不是锁住了，而是看到了旧版本。**

## 实验二：当前读

```sql
SELECT balance FROM account WHERE id=1 FOR UPDATE; -- 200
```

`FOR UPDATE` 是当前读，读最新已提交版本并加锁。所以「RR 就不会读到新数据」这句话要补前提：**只有快照读**才走 MVCC。

## 实验三：RR 能完全防幻读吗

不加锁的范围查询两次结果可能不同（另一事务插入新行且本事务更新过它），这是经典的「快照读 + 更新」组合。要彻底防幻读，用 `SERIALIZABLE` 或者悲观锁（间隙锁）。

## 结论

1. MVCC 解决的是**读写不阻塞**，代价是「同一事务里可能看到旧数据」；
2. 需要最新值就 `FOR UPDATE`；
3. 业务里判断「够不够扣」必须用**条件更新**（`UPDATE ... WHERE points >= ?`）而不是「先查再改」，后者在并发下会超卖。',
 1, 97, '2026-09-16 19:25:00', '2026-09-16 19:25:00'),

(7, 3, 3, 'React 状态更新为什么是异步批处理的',
 'setState 之后立刻读 state 还是旧值，不是 React 慢了，而是它把多次更新合并成一次渲染。',
 '# React 状态更新为什么是异步批处理的

```jsx
function Counter() {
  const [n, setN] = useState(0);
  const onClick = () => {
    setN(n + 1);
    setN(n + 1);
    console.log(n); // 还是 0
  };
  return <button onClick={onClick}>{n}</button>;
}
```

点一次只加 1。原因有三层：

## 一、事件处理函数里拿到的是本次渲染的闭包

`n` 是本次渲染时的常量，两次 `setN(n + 1)` 算出来都是 `0 + 1`，最后被合并成一次「设为 1」。

## 二、更新是排队 + 批处理的

React 18 起，`createRoot` 下的所有更新默认自动批处理（包括 `setTimeout`、`Promise` 回调里）。批处理的意义：一次渲染比三次渲染便宜，也让 UI 不会出现中间态。

## 三、要基于上一次值，就用函数式更新

```jsx
setN(prev => prev + 1);
setN(prev => prev + 1); // 现在会变成 2
```

## 想在更新后立刻读新值？

不要读。把「要基于新值做的事」写进 `useEffect`：

```jsx
useEffect(() => { document.title = "点了 " + n + " 次"; }, [n]);
```

> 记住一句话：setState 是「申请一次重渲染」，不是「立刻修改变量」。',
 1, 210, '2026-09-22 23:12:00', '2026-09-22 23:12:00'),

(8, 3, 2, 'CSS backdrop-filter 性能：玻璃拟态不卡的三条规则',
 '半透明 + 模糊很好看，但大量使用会让合成层爆炸。三条规则让视觉与帧率共存。',
 '# CSS backdrop-filter 性能：玻璃拟态不卡的三条规则

## 规则一：模糊只作用在固定的小面积元素上

```css
.glass-nav {
  background: rgb(255 255 255 / 0.62);
  backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgb(255 255 255 / 0.5);
}
```

`backdrop-filter` 需要把元素背后的内容单独合成一次纹理再模糊。面积越大、层数越多，GPU 压力越大。所以：**顶部导航、弹窗、抽屉**可以用，**整页背景**不要用。

## 规则二：不要嵌套模糊层

父元素有 `backdrop-filter`，子元素再加一层，浏览器要递归取样。两层的开销通常不是两倍，而是「每次滚动都重算」。需要层次感时，用边框、内阴影、半透明纯色叠出来。

## 规则三：给滚动内容建立隔离

```css
.glass-panel {
  contain: paint;
  will-change: transform;
}
```

`contain: paint` 告诉浏览器这块内容不会溢出，可以独立重绘；`will-change: transform` 把位移交给合成层，避免滚动时触发整层重排。

## 回退方案

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-nav { background: #f6f8fb; }
}
```

不支持时必须有**足够实的底色**，否则文字会和背后的内容糊在一起。

## 还有一条：尊重减少动效

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

模糊和视差属于「会引起不适」的动效，减少动效模式下应该直接关掉。',
 1, 176, '2026-09-19 13:10:00', '2026-09-19 13:10:00');
