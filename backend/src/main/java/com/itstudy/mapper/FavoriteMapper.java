package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.dto.ArticleCard;
import com.itstudy.dto.QuestionCard;
import com.itstudy.dto.ResourceCard;
import com.itstudy.entity.Favorite;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {

    @Select("SELECT * FROM favorite WHERE user_id = #{userId} AND target_type = #{targetType} AND target_id = #{targetId} LIMIT 1")
    Favorite selectOne(@Param("userId") Long userId,
                       @Param("targetType") String targetType,
                       @Param("targetId") Long targetId);

    @Delete("DELETE FROM favorite WHERE user_id = #{userId} AND target_type = #{targetType} AND target_id = #{targetId}")
    int deleteOne(@Param("userId") Long userId,
                  @Param("targetType") String targetType,
                  @Param("targetId") Long targetId);

    @Select("SELECT COUNT(*) FROM favorite WHERE user_id = #{userId}")
    int countByUser(@Param("userId") Long userId);

    @Select("""
            SELECT a.id, a.title, a.summary, a.section_id, s.code AS section_code, s.name AS section_name,
                   a.author_id, u.username AS author_username, u.nickname AS author_name, u.avatar_hue AS author_avatar_hue,
                   a.reward_granted, a.view_count, a.created_at, 1 AS favorite, a.like_count,
                   EXISTS (SELECT 1 FROM post_like l WHERE l.user_id = #{userId} AND l.target_type = 'article' AND l.target_id = a.id) AS liked_by_me
            FROM favorite f
            JOIN article a ON a.id = f.target_id
            LEFT JOIN section s ON s.id = a.section_id
            LEFT JOIN app_user u ON u.id = a.author_id
            WHERE f.user_id = #{userId} AND f.target_type = 'article'
            ORDER BY f.created_at DESC, f.id DESC
            """)
    List<ArticleCard> selectFavoriteArticles(@Param("userId") Long userId);

    @Select("""
            SELECT q.id, q.title, q.section_id, s.code AS section_code, s.name AS section_name,
                   q.author_id, u.username AS author_username, u.nickname AS author_name, u.avatar_hue AS author_avatar_hue,
                   q.answer_count, q.solved, q.accepted_answer_id, q.view_count, q.created_at, 1 AS favorite, q.like_count,
                   EXISTS (SELECT 1 FROM post_like l WHERE l.user_id = #{userId} AND l.target_type = 'question' AND l.target_id = q.id) AS liked_by_me
            FROM favorite f
            JOIN question q ON q.id = f.target_id
            LEFT JOIN section s ON s.id = q.section_id
            LEFT JOIN app_user u ON u.id = q.author_id
            WHERE f.user_id = #{userId} AND f.target_type = 'question'
            ORDER BY f.created_at DESC, f.id DESC
            """)
    List<QuestionCard> selectFavoriteQuestions(@Param("userId") Long userId);

    @Select("""
            SELECT r.id, r.title, r.description, r.file_type, r.file_size, r.points, r.download_count,
                   r.section_id, s.code AS section_code, s.name AS section_name,
                   EXISTS (SELECT 1 FROM resource_exchange e WHERE e.user_id = #{userId} AND e.resource_id = r.id) AS owned
            FROM favorite f
            JOIN resource r ON r.id = f.target_id
            LEFT JOIN section s ON s.id = r.section_id
            WHERE f.user_id = #{userId} AND f.target_type = 'resource'
            ORDER BY f.created_at DESC, f.id DESC
            """)
    List<ResourceCard> selectFavoriteResources(@Param("userId") Long userId);
}
