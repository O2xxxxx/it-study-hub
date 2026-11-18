package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.dto.ResourceCard;
import com.itstudy.entity.Resource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface ResourceMapper extends BaseMapper<Resource> {

    @Select("""
            <script>
            SELECT r.id, r.title, r.description, r.file_type, r.file_size, r.points, r.download_count,
                   r.section_id, s.code AS section_code, s.name AS section_name,
                   <choose>
                       <when test="userId != null">
                           EXISTS (SELECT 1 FROM resource_exchange e WHERE e.user_id = #{userId} AND e.resource_id = r.id)
                       </when>
                       <otherwise>0</otherwise>
                   </choose> AS owned
            FROM resource r
            LEFT JOIN section s ON s.id = r.section_id
            <where>
                <if test="sectionCode != null and sectionCode != ''">AND s.code = #{sectionCode}</if>
            </where>
            ORDER BY r.download_count DESC, r.id ASC
            LIMIT #{limit} OFFSET #{offset}
            </script>
            """)
    List<ResourceCard> selectCards(@Param("sectionCode") String sectionCode,
                                   @Param("userId") Long userId,
                                   @Param("offset") int offset,
                                   @Param("limit") int limit);

    @Select("""
            <script>
            SELECT COUNT(*)
            FROM resource r
            LEFT JOIN section s ON s.id = r.section_id
            <where>
                <if test="sectionCode != null and sectionCode != ''">AND s.code = #{sectionCode}</if>
            </where>
            </script>
            """)
    long countCards(@Param("sectionCode") String sectionCode);

    @Select("""
            <script>
            SELECT r.id, r.title, r.description, r.file_type, r.file_size, r.points, r.download_count,
                   r.section_id, s.code AS section_code, s.name AS section_name,
                   <choose>
                       <when test="userId != null">
                           EXISTS (SELECT 1 FROM resource_exchange e WHERE e.user_id = #{userId} AND e.resource_id = r.id)
                       </when>
                       <otherwise>0</otherwise>
                   </choose> AS owned
            FROM resource r
            LEFT JOIN section s ON s.id = r.section_id
            WHERE r.id = #{id}
            </script>
            """)
    ResourceCard selectCardById(@Param("id") Long id, @Param("userId") Long userId);

    @Update("UPDATE resource SET download_count = download_count + 1 WHERE id = #{id}")
    int incrementDownload(@Param("id") Long id);
}
