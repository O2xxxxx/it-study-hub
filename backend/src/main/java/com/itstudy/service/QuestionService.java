package com.itstudy.service;

import com.itstudy.common.PageResult;
import com.itstudy.dto.AcceptForm;
import com.itstudy.dto.AcceptResult;
import com.itstudy.dto.AnswerForm;
import com.itstudy.dto.AnswerResult;
import com.itstudy.dto.PublishResult;
import com.itstudy.dto.QuestionCard;
import com.itstudy.dto.QuestionDetail;
import com.itstudy.dto.QuestionForm;

public interface QuestionService {

    PageResult<QuestionCard> page(String sectionCode, String filter, Integer page, Integer size, Long userId);

    QuestionDetail detail(Long id, Long userId);

    /** 提问：不加分。 */
    PublishResult ask(Long userId, QuestionForm form);

    /** 回答：同一问题同一人只能一条，事务内 +3 积分。 */
    AnswerResult answer(Long userId, Long questionId, AnswerForm form);

    /** 采纳：仅提问者，与积分无关。 */
    AcceptResult accept(Long userId, Long questionId, AcceptForm form);
}
