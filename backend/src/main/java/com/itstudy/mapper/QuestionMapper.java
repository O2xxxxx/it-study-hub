package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.dto.QuestionCard;
import com.itstudy.entity.Question;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {

    @Select("""
            <script>
            SELECT q.id, q.title, q.content_md, q.section_id, s.code AS section_code, s.name AS section_name,
                   q.author_id, u.username AS author_username, u.nickname AS author_name, u.avatar_hue AS author_avatar_hue,
                   q.answer_count, q.solved, q.accepted_answer_id, q.view_count, q.created_at,
                   <choose>
                       <when test="userId != null">
                           EXISTS (SELECT 1 FROM favorite f WHERE f.user_id = #{userId} AND f.target_type = 'question' AND f.target_id = q.id)
                       </when>
                       <otherwise>0</otherwise>
                   </choose> AS favorite, q.like_count,
                   <choose>
                       <when test="userId != null">
                           EXISTS (SELECT 1 FROM post_like l WHERE l.user_id = #{userId} AND l.target_type = 'question' AND l.target_id = q.id)
                       </when>
                       <otherwise>0</otherwise>
                   </choose> AS liked_by_me
            FROM question q
            LEFT JOIN section s ON s.id = q.section_id
            LEFT JOIN app_user u ON u.id = q.author_id
            <where>
                <if test="sectionCode != null and sectionCode != ''">AND s.code = #{sectionCode}</if>
                <if test="authorId != null">AND q.author_id = #{authorId}</if>
                <if test="filter == 'unsolved'">AND q.solved = 0</if>
                <if test="filter == 'solved'">AND q.solved = 1</if>
            </where>
            ORDER BY q.created_at DESC, q.id DESC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<QuestionCard> selectCards(@Param("sectionCode") String sectionCode,
                                   @Param("filter") String filter,
                                   @Param("authorId") Long authorId,
                                   @Param("userId") Long userId,
                                   @Param("offset") int offset,
                                   @Param("limit") int limit);

    @Select("""
            <script>
            SELECT COUNT(*)
            FROM question q
            LEFT JOIN section s ON s.id = q.section_id
            <where>
                <if test="sectionCode != null and sectionCode != ''">AND s.code = #{sectionCode}</if>
                <if test="authorId != null">AND q.author_id = #{authorId}</if>
                <if test="filter == 'unsolved'">AND q.solved = 0</if>
                <if test="filter == 'solved'">AND q.solved = 1</if>
            </where>
            </script>
            """)
    long countCards(@Param("sectionCode") String sectionCode, @Param("filter") String filter, @Param("authorId") Long authorId);

    @Update("UPDATE question SET view_count = view_count + 1 WHERE id = #{id}")
    int incrementView(@Param("id") Long id);

    @Update("UPDATE question SET answer_count = answer_count + 1, updated_at = NOW() WHERE id = #{id}")
    int incrementAnswerCount(@Param("id") Long id);

    /** 条件更新：只有未采纳的问题才会被标记，并发采纳时最多一条成功。 */
    @Update("""
            UPDATE question SET solved = 1, accepted_answer_id = #{answerId}, updated_at = NOW()
            WHERE id = #{id} AND solved = 0 AND accepted_answer_id IS NULL
            """)
    int markSolved(@Param("id") Long id, @Param("answerId") Long answerId);

    @Update("UPDATE question SET solved = 0, accepted_answer_id = NULL, updated_at = NOW() WHERE id = #{id}")
    int clearSolved(@Param("id") Long id);

    @Select("SELECT like_count FROM question WHERE id = #{id} FOR UPDATE")
    Integer lockLikeCount(@Param("id") Long id);

    @Update("UPDATE question SET like_count = GREATEST(CAST(like_count AS SIGNED) + #{delta}, 0) WHERE id = #{id}")
    int adjustLikes(@Param("id") Long id, @Param("delta") int delta);
}
