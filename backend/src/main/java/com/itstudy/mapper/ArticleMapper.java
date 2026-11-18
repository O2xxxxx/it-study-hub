package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.dto.ArticleCard;
import com.itstudy.entity.Article;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface ArticleMapper extends BaseMapper<Article> {

    @Select("""
            <script>
            SELECT a.id, a.title, a.summary, a.section_id, s.code AS section_code, s.name AS section_name,
                   a.author_id, u.nickname AS author_name, u.avatar_hue AS author_avatar_hue,
                   a.reward_granted, a.view_count, a.created_at,
                   <choose>
                       <when test="userId != null">
                           EXISTS (SELECT 1 FROM favorite f WHERE f.user_id = #{userId} AND f.target_type = 'article' AND f.target_id = a.id)
                       </when>
                       <otherwise>0</otherwise>
                   </choose> AS favorite
            FROM article a
            LEFT JOIN section s ON s.id = a.section_id
            LEFT JOIN app_user u ON u.id = a.author_id
            <where>
                <if test="sectionCode != null and sectionCode != ''">AND s.code = #{sectionCode}</if>
                <if test="authorId != null">AND a.author_id = #{authorId}</if>
            </where>
            <choose>
                <when test="sort == 'hot'">ORDER BY a.view_count DESC, a.created_at DESC, a.id DESC</when>
                <otherwise>ORDER BY a.created_at DESC, a.id DESC</otherwise>
            </choose>
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<ArticleCard> selectCards(@Param("sectionCode") String sectionCode,
                                  @Param("authorId") Long authorId,
                                  @Param("sort") String sort,
                                  @Param("userId") Long userId,
                                  @Param("offset") int offset,
                                  @Param("limit") int limit);

    @Select("""
            <script>
            SELECT COUNT(*)
            FROM article a
            LEFT JOIN section s ON s.id = a.section_id
            <where>
                <if test="sectionCode != null and sectionCode != ''">AND s.code = #{sectionCode}</if>
                <if test="authorId != null">AND a.author_id = #{authorId}</if>
            </where>
            </script>
            """)
    long countCards(@Param("sectionCode") String sectionCode, @Param("authorId") Long authorId);

    @Update("UPDATE article SET view_count = view_count + 1 WHERE id = #{id}")
    int incrementView(@Param("id") Long id);
}
