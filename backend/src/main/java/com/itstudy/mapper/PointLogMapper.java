package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.dto.PointLogView;
import com.itstudy.entity.PointLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PointLogMapper extends BaseMapper<PointLog> {

    /** 业务幂等检查：同一用户同一业务（reason_type + ref_id）是否已经记过流水。 */
    @Select("SELECT COUNT(*) FROM point_log WHERE user_id = #{userId} AND reason_type = #{reasonType} AND ref_id = #{refId}")
    int countBusiness(@Param("userId") Long userId, @Param("reasonType") String reasonType, @Param("refId") Long refId);

    @Select("""
            SELECT id, user_id, change_amount, balance_after, reason_type, reason_desc, ref_type, ref_id, created_at
            FROM point_log
            WHERE user_id = #{userId}
            ORDER BY created_at DESC, id DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<PointLogView> selectPage(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM point_log WHERE user_id = #{userId}")
    long countByUser(@Param("userId") Long userId);

    @Select("SELECT COALESCE(SUM(change_amount), 0) FROM point_log WHERE user_id = #{userId} AND change_amount > 0")
    int sumEarned(@Param("userId") Long userId);

    @Select("SELECT COALESCE(SUM(-change_amount), 0) FROM point_log WHERE user_id = #{userId} AND change_amount < 0")
    int sumSpent(@Param("userId") Long userId);
}
