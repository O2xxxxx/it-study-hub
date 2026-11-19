package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.entity.PostLike;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PostLikeMapper extends BaseMapper<PostLike> {

    @Select("SELECT EXISTS(SELECT 1 FROM post_like WHERE user_id = #{userId} AND target_type = #{type} AND target_id = #{id})")
    boolean existsLike(@Param("userId") Long userId, @Param("type") String type, @Param("id") Long id);

    @Delete("DELETE FROM post_like WHERE user_id = #{userId} AND target_type = #{type} AND target_id = #{id}")
    int deleteLike(@Param("userId") Long userId, @Param("type") String type, @Param("id") Long id);

    @Delete("DELETE FROM post_like WHERE target_type = #{type} AND target_id = #{id}")
    int deleteForPost(@Param("type") String type, @Param("id") Long id);
}
