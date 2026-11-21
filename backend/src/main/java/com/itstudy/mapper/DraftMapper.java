package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.entity.Draft;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DraftMapper extends BaseMapper<Draft> {

    /** 按账号列出草稿；draftType 为空时返回全部类型。 */
    @Select("""
            <script>
            SELECT * FROM draft
            WHERE user_id = #{userId}
            <if test="draftType != null and draftType != ''">AND draft_type = #{draftType}</if>
            ORDER BY updated_at DESC, id DESC
            </script>
            """)
    List<Draft> selectByUserAndType(@Param("userId") Long userId, @Param("draftType") String draftType);

    @Select("""
            SELECT * FROM draft
            WHERE user_id = #{userId} AND draft_type = #{draftType} AND draft_key = #{draftKey}
            LIMIT 1
            """)
    Draft selectBySlot(@Param("userId") Long userId,
                       @Param("draftType") String draftType,
                       @Param("draftKey") String draftKey);

    /** 利用 uk_draft_slot 做 upsert。 */
    @Insert("""
            INSERT INTO draft (user_id, draft_type, draft_key, title, section_id, content_md, updated_at)
            VALUES (#{userId}, #{draftType}, #{draftKey}, #{title}, #{sectionId}, #{contentMd}, NOW())
            ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                section_id = VALUES(section_id),
                content_md = VALUES(content_md),
                updated_at = NOW()
            """)
    int upsert(@Param("userId") Long userId,
               @Param("draftType") String draftType,
               @Param("draftKey") String draftKey,
               @Param("title") String title,
               @Param("sectionId") Long sectionId,
               @Param("contentMd") String contentMd);

    @Delete("DELETE FROM draft WHERE user_id = #{userId} AND draft_type = #{draftType} AND draft_key = #{draftKey}")
    int deleteBySlot(@Param("userId") Long userId,
                     @Param("draftType") String draftType,
                     @Param("draftKey") String draftKey);
}
