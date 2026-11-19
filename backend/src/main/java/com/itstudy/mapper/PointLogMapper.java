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
            SELECT l.id, l.user_id, l.change_amount, l.balance_after, l.reason_type, l.reason_desc, l.ref_type, l.ref_id, l.created_at,
                   CASE
                       WHEN a.id IS NOT NULL THEN CONCAT('/articles/', a.id)
                       WHEN q.id IS NOT NULL THEN CONCAT('/qa/', q.id)
                       WHEN r.id IS NOT NULL THEN CONCAT('/resources/', r.id)
                   END AS target_path
            FROM point_log l
            LEFT JOIN article a ON LOWER(l.ref_type) = 'article' AND a.id = l.ref_id
            LEFT JOIN answer an ON LOWER(l.ref_type) = 'answer' AND an.id = l.ref_id
            LEFT JOIN question q ON q.id = COALESCE(an.question_id, IF(LOWER(l.ref_type) = 'question', l.ref_id, NULL))
            LEFT JOIN resource_exchange e ON BINARY l.ref_type IN ('resource', 'resource_exchange')
                AND e.id = l.ref_id AND e.user_id = l.user_id
            LEFT JOIN resource r ON r.id = COALESCE(e.resource_id, IF(BINARY l.ref_type = 'RESOURCE', l.ref_id, NULL))
            WHERE l.user_id = #{userId}
            ORDER BY l.created_at DESC, l.id DESC
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
