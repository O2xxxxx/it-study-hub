package com.itstudy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.itstudy.entity.Answer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface AnswerMapper extends BaseMapper<Answer> {

    @Select("SELECT * FROM answer WHERE question_id = #{questionId} ORDER BY is_accepted DESC, created_at ASC, id ASC")
    List<Answer> selectByQuestion(@Param("questionId") Long questionId);

    @Select("SELECT COUNT(*) FROM answer WHERE question_id = #{questionId} AND author_id = #{authorId}")
    int countByQuestionAndAuthor(@Param("questionId") Long questionId, @Param("authorId") Long authorId);

    @Select("SELECT * FROM answer WHERE question_id = #{questionId} AND author_id = #{authorId} LIMIT 1")
    Answer selectByQuestionAndAuthor(@Param("questionId") Long questionId, @Param("authorId") Long authorId);

    @Update("UPDATE answer SET is_accepted = #{accepted} WHERE id = #{id}")
    int updateAccepted(@Param("id") Long id, @Param("accepted") boolean accepted);
}
