package com.itstudy.mapper;

import com.itstudy.dto.SearchRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SearchMapper {

    @Select("""
            <script>
            SELECT a.id, a.title, a.summary, a.content_md, a.created_at,
                   s.code AS section_code, s.name AS section_name, u.nickname AS author_name
            FROM article a
            LEFT JOIN section s ON s.id = a.section_id
            LEFT JOIN app_user u ON u.id = a.author_id
            WHERE (a.title LIKE CONCAT('%', #{keyword}, '%')
                OR a.summary LIKE CONCAT('%', #{keyword}, '%')
                OR a.content_md LIKE CONCAT('%', #{keyword}, '%'))
            <if test="sectionCode != null and sectionCode != ''">
                AND s.code = #{sectionCode}
            </if>
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT #{limit}
            </script>
            """)
    List<SearchRow> searchArticles(@Param("keyword") String keyword,
                                   @Param("sectionCode") String sectionCode,
                                   @Param("limit") int limit);

    @Select("""
            <script>
            SELECT q.id, q.title, q.content_md, q.created_at,
                   s.code AS section_code, s.name AS section_name, u.nickname AS author_name
            FROM question q
            LEFT JOIN section s ON s.id = q.section_id
            LEFT JOIN app_user u ON u.id = q.author_id
            WHERE (q.title LIKE CONCAT('%', #{keyword}, '%')
                OR q.content_md LIKE CONCAT('%', #{keyword}, '%'))
            <if test="sectionCode != null and sectionCode != ''">
                AND s.code = #{sectionCode}
            </if>
            ORDER BY q.created_at DESC, q.id DESC
            LIMIT #{limit}
            </script>
            """)
    List<SearchRow> searchQuestions(@Param("keyword") String keyword,
                                    @Param("sectionCode") String sectionCode,
                                    @Param("limit") int limit);

    @Select("""
            <script>
            SELECT r.id, r.title, r.description, r.file_type, r.points, r.created_at,
                   s.code AS section_code, s.name AS section_name, u.nickname AS author_name
            FROM resource r
            LEFT JOIN section s ON s.id = r.section_id
            LEFT JOIN app_user u ON u.id = r.uploader_id
            WHERE (r.title LIKE CONCAT('%', #{keyword}, '%')
                OR r.description LIKE CONCAT('%', #{keyword}, '%'))
            <if test="sectionCode != null and sectionCode != ''">
                AND s.code = #{sectionCode}
            </if>
            ORDER BY r.created_at DESC, r.id DESC
            LIMIT #{limit}
            </script>
            """)
    List<SearchRow> searchResources(@Param("keyword") String keyword,
                                    @Param("sectionCode") String sectionCode,
                                    @Param("limit") int limit);
}
