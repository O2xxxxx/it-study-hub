package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.entity.UserFollow;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface UserFollowMapper extends BaseMapper<UserFollow> {

    @Select("SELECT EXISTS(SELECT 1 FROM user_follow WHERE follower_id = #{from} AND followee_id = #{to})")
    boolean existsFollow(@Param("from") Long from, @Param("to") Long to);

    @Delete("DELETE FROM user_follow WHERE follower_id = #{from} AND followee_id = #{to}")
    int deleteFollow(@Param("from") Long from, @Param("to") Long to);

    @Select("SELECT follower_id FROM user_follow WHERE followee_id = #{id} ORDER BY id DESC LIMIT #{size} OFFSET #{offset}")
    List<Long> followers(@Param("id") Long id, @Param("offset") int offset, @Param("size") int size);

    @Select("SELECT followee_id FROM user_follow WHERE follower_id = #{id} ORDER BY id DESC LIMIT #{size} OFFSET #{offset}")
    List<Long> following(@Param("id") Long id, @Param("offset") int offset, @Param("size") int size);
}
