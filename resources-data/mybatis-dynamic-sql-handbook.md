# MyBatis 动态 SQL 实战手册（原创）

动态 SQL 是 MyBatis 的招牌能力，但写错一个 `<if>` 就会让索引失效或者 SQL 语法报错。本手册总结四类模板与五个坑。

## 一、<if> 与 <where>：最常见的组合

```xml
<select id="search" resultType="ArticleCard">
  SELECT id, title, summary, created_at
  FROM article
  <where>
    <if test="sectionId != null">AND section_id = #{sectionId}</if>
    <if test="keyword != null and keyword != ''">
      AND title LIKE CONCAT('%', #{keyword}, '%')
    </if>
  </where>
  ORDER BY id DESC
  LIMIT #{offset}, #{size}
</select>
```

要点：`<where>` 会自动去掉开头多余的 AND/OR，并且在没有条件时不会输出 WHERE 关键字；不要自己写 `WHERE 1=1`，它会挡住部分优化。

## 二、<choose>：等价于 switch

```xml
<choose>
  <when test="scope == 'title'">AND title LIKE CONCAT('%', #{kw}, '%')</when>
  <when test="scope == 'body'">AND content_md LIKE CONCAT('%', #{kw}, '%')</when>
  <otherwise>AND (title LIKE CONCAT('%', #{kw}, '%') OR content_md LIKE CONCAT('%', #{kw}, '%'))</otherwise>
</choose>
```

## 三、<foreach>：IN 集合与批量插入

```xml
<select id="findByIds" resultType="Article">
  SELECT * FROM article WHERE id IN
  <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
</select>

<insert id="batchInsert">
  INSERT INTO favorite (user_id, target_type, target_id) VALUES
  <foreach collection="list" item="it" separator=",">
    (#{it.userId}, #{it.targetType}, #{it.targetId})
  </foreach>
</insert>
```

注意：集合参数在 Mapper 接口上要写 `@Param`，否则 `collection` 只能写成 `list`/`array`，换成 Set 就会报错。

## 四、<set> 与 <trim>：动态更新

```xml
<update id="updateArticle">
  UPDATE article
  <set>
    <if test="title != null">title = #{title},</if>
    <if test="contentMd != null">content_md = #{contentMd},</if>
    updated_at = NOW()
  </set>
  WHERE id = #{id} AND author_id = #{operatorId}
</update>
```

`<set>` 会删掉末尾多余的逗号；`<trim prefix="SET" suffixOverrides=",">` 是它的通用形式。

## 五、五个常见坑

1. `<if test="keyword != ''">` 对空字符串有效，但对未传的参数（null）也会成立，必须写成 `keyword != null and keyword != ''`。
2. `#{$...}`：`#{}` 是预编译占位符，`${}` 是字符串拼接，后者有 SQL 注入风险，只允许用于排序字段白名单。
3. LIKE 不要写成 `LIKE '%#{kw}%'`，参数放进引号里会变成字面量。
4. `<foreach>` 生成的 IN 列表过长（超过 1000）会让优化器走全表，必要时改成分批查询。
5. 动态 SQL 里用 `<bind>` 缓存计算结果，避免同一个表达式重复求值。

## 六、调试方法

打开日志 `logging.level.com.example=debug`，MyBatis 会打印最终 SQL 与参数；配合 `Preparing:` 与 `Parameters:` 两行即可定位拼接问题。
