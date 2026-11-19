package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.entity.AppUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface AppUserMapper extends BaseMapper<AppUser> {

    /** 增加积分（文章发布奖励 / 回答奖励）。 */
    @Update("UPDATE app_user SET points = points + #{delta}, updated_at = NOW() WHERE id = #{id}")
    int addPoints(@Param("id") Long id, @Param("delta") int delta);

    /** 条件扣减积分：余额不足时影响行数为 0。 */
    @Update("UPDATE app_user SET points = points - #{cost}, updated_at = NOW() WHERE id = #{id} AND points >= #{cost}")
    int deductPoints(@Param("id") Long id, @Param("cost") int cost);

    @Select("SELECT points FROM app_user WHERE id = #{id}")
    Integer selectBalance(@Param("id") Long id);

    @Select("SELECT * FROM app_user WHERE username = #{username}")
    AppUser selectByUsername(@Param("username") String username);

    @Select("SELECT * FROM app_user WHERE id = #{id} FOR UPDATE")
    AppUser lockUser(@Param("id") Long id);

    @Update("UPDATE app_user SET follower_count = GREATEST(CAST(follower_count AS SIGNED) + #{delta}, 0) WHERE id = #{id}")
    int adjustFollowers(@Param("id") Long id, @Param("delta") int delta);

    @Update("UPDATE app_user SET following_count = GREATEST(CAST(following_count AS SIGNED) + #{delta}, 0) WHERE id = #{id}")
    int adjustFollowing(@Param("id") Long id, @Param("delta") int delta);

    @Update("UPDATE app_user SET nickname = #{nickname}, updated_at = NOW() WHERE id = #{id}")
    int rename(@Param("id") Long id, @Param("nickname") String nickname);

    @Select("SELECT COUNT(*) FROM answer WHERE author_id = #{id}")
    long countAnswers(@Param("id") Long id);
}
