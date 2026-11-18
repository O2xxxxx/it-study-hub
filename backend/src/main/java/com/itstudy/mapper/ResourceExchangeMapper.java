package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.dto.ExchangeView;
import com.itstudy.entity.ResourceExchange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ResourceExchangeMapper extends BaseMapper<ResourceExchange> {

    @Select("SELECT * FROM resource_exchange WHERE user_id = #{userId} AND resource_id = #{resourceId} LIMIT 1")
    ResourceExchange selectByUserAndResource(@Param("userId") Long userId, @Param("resourceId") Long resourceId);

    @Select("""
            SELECT e.id, e.resource_id, r.title AS resource_title, r.file_type, e.points_cost, e.created_at
            FROM resource_exchange e
            JOIN resource r ON r.id = e.resource_id
            WHERE e.user_id = #{userId}
            ORDER BY e.created_at DESC, e.id DESC
            """)
    List<ExchangeView> selectExchanges(@Param("userId") Long userId);
}
