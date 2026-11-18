package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.dto.SectionView;
import com.itstudy.entity.Section;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SectionMapper extends BaseMapper<Section> {

    @Select("""
            SELECT s.id, s.code, s.name, s.tagline, s.description, s.icon, s.accent, s.sort_order,
                   (SELECT COUNT(*) FROM article a WHERE a.section_id = s.id) AS article_count,
                   (SELECT COUNT(*) FROM question q WHERE q.section_id = s.id) AS question_count,
                   (SELECT COUNT(*) FROM resource r WHERE r.section_id = s.id) AS resource_count
            FROM section s
            ORDER BY s.sort_order ASC, s.id ASC
            """)
    List<SectionView> selectAllWithStats();

    @Select("""
            SELECT s.id, s.code, s.name, s.tagline, s.description, s.icon, s.accent, s.sort_order,
                   (SELECT COUNT(*) FROM article a WHERE a.section_id = s.id) AS article_count,
                   (SELECT COUNT(*) FROM question q WHERE q.section_id = s.id) AS question_count,
                   (SELECT COUNT(*) FROM resource r WHERE r.section_id = s.id) AS resource_count
            FROM section s
            WHERE s.code = #{code}
            """)
    SectionView selectByCodeWithStats(@Param("code") String code);
}
