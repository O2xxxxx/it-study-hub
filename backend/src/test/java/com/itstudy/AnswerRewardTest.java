package com.itstudy;

import com.itstudy.common.BizException;
import com.itstudy.dto.AcceptForm;
import com.itstudy.dto.AcceptResult;
import com.itstudy.dto.AnswerForm;
import com.itstudy.dto.AnswerResult;
import com.itstudy.dto.PublishResult;
import com.itstudy.dto.QuestionForm;
import com.itstudy.entity.Answer;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.Question;
import com.itstudy.entity.Section;
import com.itstudy.mapper.AnswerMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.QuestionMapper;
import com.itstudy.service.QuestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Transactional
class AnswerRewardTest extends BaseIntegrationTest {

    @Autowired
    private QuestionService questionService;
    @Autowired
    private QuestionMapper questionMapper;
    @Autowired
    private AnswerMapper answerMapper;
    @Autowired
    private PointLogMapper pointLogMapper;

    @Test
    void firstAnswerAwardsThreePoints() {
        AppUser asker = createUser(0);
        AppUser answerer = createUser(0);
        Section section = createSection();
        PublishResult question = ask(asker, section);

        AnswerResult answer = questionService.answer(answerer.getId(), question.getId(), answerForm("试试用 @Transactional"));

        assertEquals(3, answer.getPointsDelta().intValue());
        assertEquals(3, answer.getBalance());
        assertEquals(3, appUserMapper.selectBalance(answerer.getId()).intValue());
        assertEquals(1, questionMapper.selectById(question.getId()).getAnswerCount());
        assertEquals(1, pointLogMapper.countBusiness(answerer.getId(), "ANSWER_REWARD", answer.getId()));
    }

    @Test
    void duplicateAnswerIsRejectedWithoutExtraPoints() {
        AppUser asker = createUser(0);
        AppUser answerer = createUser(0);
        Section section = createSection();
        PublishResult question = ask(asker, section);
        questionService.answer(answerer.getId(), question.getId(), answerForm("第一次回答"));

        BizException error = assertThrows(BizException.class,
                () -> questionService.answer(answerer.getId(), question.getId(), answerForm("重复回答")));

        assertEquals("DUPLICATE_ANSWER", error.getCode());
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        assertEquals(3, appUserMapper.selectBalance(answerer.getId()).intValue());
        assertEquals(1, questionMapper.selectById(question.getId()).getAnswerCount());
        assertEquals(1, pointLogMapper.countByUser(answerer.getId()));
    }

    @Test
    void answeringOwnQuestionIsRejected() {
        AppUser asker = createUser(0);
        Section section = createSection();
        PublishResult question = ask(asker, section);

        BizException error = assertThrows(BizException.class,
                () -> questionService.answer(asker.getId(), question.getId(), answerForm("自己回答")));

        assertEquals("CANNOT_ANSWER_OWN_QUESTION", error.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals(0, appUserMapper.selectBalance(asker.getId()).intValue());
        assertEquals(0, questionMapper.selectById(question.getId()).getAnswerCount());
    }

    @Test
    void acceptMarksQuestionSolved() {
        AppUser asker = createUser(0);
        AppUser answerer = createUser(0);
        Section section = createSection();
        PublishResult question = ask(asker, section);
        AnswerResult answer = questionService.answer(answerer.getId(), question.getId(), answerForm("可以加断点看事务边界"));

        AcceptForm form = new AcceptForm();
        form.setAnswerId(answer.getId());
        AcceptResult accepted = questionService.accept(asker.getId(), question.getId(), form);

        assertEquals(question.getId(), accepted.getQuestionId());
        assertEquals(answer.getId(), accepted.getAcceptedAnswerId());
        assertTrue(Boolean.TRUE.equals(accepted.getSolved()));

        Question solved = questionMapper.selectById(question.getId());
        assertTrue(Boolean.TRUE.equals(solved.getSolved()));
        assertEquals(answer.getId(), solved.getAcceptedAnswerId());
        Answer acceptedAnswer = answerMapper.selectById(answer.getId());
        assertTrue(Boolean.TRUE.equals(acceptedAnswer.getIsAccepted()));
    }

    private PublishResult ask(AppUser asker, Section section) {
        QuestionForm form = new QuestionForm();
        form.setTitle("Spring 事务边界怎么划？");
        form.setSectionId(section.getId());
        form.setContentMd("在 service 方法上加 @Transactional 就够了吗？");
        return questionService.ask(asker.getId(), form);
    }

    private AnswerForm answerForm(String content) {
        AnswerForm form = new AnswerForm();
        form.setContentMd(content);
        return form;
    }
}
