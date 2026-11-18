# Spring MVC 一次请求的完整旅程（原创讲义）

本文按「一个真实请求」的时间顺序，把 DispatcherServlet、HandlerMapping、HandlerAdapter、参数绑定、视图渲染这几个环节串成一条线，适合对照源码阅读。

## 0. 起点：Servlet 容器把请求交给谁

Tomcat 收到 `GET /api/articles/12` 后，找到注册在 web.xml 或 Servlet 注解上的 DispatcherServlet。它继承 `HttpServlet`，最终走到 `doService` → `doDispatch`。

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    HandlerExecutionChain mappedHandler = null;
    ModelAndView mv = null;
    try {
        // 1. 找处理器：/api/articles/12 -> ArticleController.detail(12)
        mappedHandler = getHandler(processedRequest);
        if (mappedHandler == null) { noHandlerFound(processedRequest, response); return; }
        // 2. 找适配器：反射调用 / @ResponseBody 处理
        HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
        // 3. 拦截器 preHandle
        if (!mappedHandler.applyPreHandle(processedRequest, response)) return;
        // 4. 真正执行方法（含参数绑定、返回值处理）
        mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
        // 5. 拦截器 postHandle
        mappedHandler.applyPostHandle(processedRequest, response, mv);
    } catch (Exception ex) {
        dispatchException = ex;
    }
    processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
}
```

## 1. HandlerMapping 如何命中

Spring Boot 默认注入 `RequestMappingHandlerMapping`。它为每个 `@RequestMapping` 方法生成 `RequestMappingInfo`（路径、方法、参数条件、请求头、consumes/produces），请求进来用 `AntPathMatcher` 或 `PathPatternParser` 匹配，最长路径优先。

常见疑问：为什么同时有 `/api/articles/{id}` 和 `/api/articles/search` 时，search 不会走进 `{id}`？
答：精确路径的匹配优先级高于变量路径，RequestMappingInfo 内部按 PatternsRequestCondition 的比较规则排序。

## 2. HandlerAdapter 与参数绑定

拿到方法后，`ServletInvocableHandlerMethod` 会逐个解析方法参数。每个参数由 `HandlerMethodArgumentResolver` 负责：

| 注解 / 类型 | 解析器 | 行为 |
| --- | --- | --- |
| `@PathVariable` | PathVariableMethodArgumentResolver | 取 URI 模板变量并做类型转换 |
| `@RequestParam` | RequestParamMethodArgumentResolver | 取 query/form 参数，支持 required/defaultValue |
| `@RequestBody` | RequestResponseBodyMethodProcessor | 用消息转换器把 JSON 反序列化成对象 |
| `@Valid` + BindingResult | 绑定校验 | 失败时把错误装进 BindingResult 而不是直接抛异常 |
| `HttpSession` | ServletRequestMethodArgumentResolver | 直接注入会话对象 |

## 3. 返回值处理

- 返回 `ModelAndView`：走视图解析，服务端渲染。
- 类或方法上有 `@ResponseBody` / `@RestController`：走 `RequestResponseBodyMethodProcessor`，用 `MappingJackson2HttpMessageConverter` 序列化 JSON，此时不再看视图解析器。

## 4. 异常与统一响应

`@RestControllerAdvice` + `@ExceptionHandler` 会在 `processDispatchResult` 阶段接管异常。实践中建议：业务异常抛 `BizException(code, message)`，由全局处理器转成 HTTP 状态码 + 统一 JSON，避免每个 Controller 手写 try/catch。

## 5. 自查清单

1. 请求进入时是否被拦截器拦住，权限校验放在 preHandle 还是 Service？
2. 参数校验失败返回 400 还是 200 + code？团队要统一。
3. 大对象是否被 `@RequestBody` 全量反序列化，是否有字段级白名单？
4. 视图渲染是否还需要，前后端分离时应当全部走 `@ResponseBody`。

> 学完这篇，你能解释：为什么加了 `@ResponseBody` 之后视图解析器就不再起作用。
