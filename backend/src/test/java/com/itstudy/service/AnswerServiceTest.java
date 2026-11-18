package com.itstudy.service;

import com.itstudy.common.BizException;
import com.itstudy.config.PointsProperties;
import com.itstudy.dto.AnswerForm;
import com.itstudy.dto.AnswerResult;
import com.itstudy.entity.Answer;
import com.itstudy.entity.PointLog;
import com.itstudy.entity.Question;
import com.itstudy.mapper.AnswerMapper;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.FavoriteMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.QuestionMapper;
import com.itstudy.mapper.SectionMapper;
import com.itstudy.service.impl.QuestionServiceImpl;
import com.itstudy.util.MarkdownRenderer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AnswerServiceTest {

    private QuestionMapper questionMapper;
    private AnswerMapper answerMapper;
    private AppUserMapper appUserMapper;
    private PointLogMapper pointLogMapper;
    private QuestionServiceImpl questionService;

    @BeforeEach
    void setUp() {
        questionMapper = mock(QuestionMapper.class);
        answerMapper = mock(AnswerMapper.class);
        SectionMapper sectionMapper = mock(SectionMapper.class);
        appUserMapper = mock(AppUserMapper.class);
        pointLogMapper = mock(PointLogMapper.class);
        FavoriteMapper favoriteMapper = mock(FavoriteMapper.class);
        MarkdownRenderer renderer = mock(MarkdownRenderer.class);
        PointsProperties points = new PointsProperties();
        points.setArticlePublish(5);
        points.setAnswerCreate(3);
        questionService = new QuestionServiceImpl(questionMapper, answerMapper, sectionMapper, appUserMapper,
                pointLogMapper, favoriteMapper, renderer, points);
    }

    private Question question() {
        Question question = new Question();
        question.setId(1L);
        question.setAuthorId(1L);
        question.setSectionId(1L);
        question.setTitle("如何理解 Spring MVC 的请求流程？");
        question.setContentMd("求解释");
        question.setAnswerCount(0);
        question.setSolved(Boolean.FALSE);
        question.setViewCount(0);
        return question;
    }

    private AnswerForm form() {
        AnswerForm form = new AnswerForm();
        form.setContentMd("先过 DispatcherServlet，再交给 HandlerMapping。");
        return form;
    }

    @Test
    @DisplayName("同一问题同一人重复回答抛出 DUPLICATE_ANSWER")
    void duplicateAnswerIsRejected() {
        when(questionMapper.selectById(1L)).thenReturn(question());
        when(answerMapper.countByQuestionAndAuthor(1L, 2L)).thenReturn(1);

        BizException ex = assertThrows(BizException.class, () -> questionService.answer(2L, 1L, form()));

        assertEquals("DUPLICATE_ANSWER", ex.getCode());
        assertEquals(409, ex.getStatus().value());
        verify(answerMapper, never()).insert(any(Answer.class));
        verify(appUserMapper, never()).addPoints(anyLong(), anyInt());
    }

    @Test
    @DisplayName("首次回答加 3 分并写一条流水")
    void firstAnswerAwardsPoints() {
        when(questionMapper.selectById(1L)).thenReturn(question());
        when(answerMapper.countByQuestionAndAuthor(1L, 2L)).thenReturn(0);
        when(answerMapper.insert(any(Answer.class))).thenAnswer(invocation -> {
            Answer answer = invocation.getArgument(0);
            answer.setId(55L);
            return 1;
        });
        when(questionMapper.incrementAnswerCount(1L)).thenReturn(1);
        when(pointLogMapper.countBusiness(2L, "ANSWER_REWARD", 55L)).thenReturn(0);
        when(appUserMapper.selectBalance(2L)).thenReturn(7, 10);
        when(appUserMapper.addPoints(2L, 3)).thenReturn(1);

        AnswerResult result = questionService.answer(2L, 1L, form());

        assertEquals(55L, result.getId());
        assertEquals(3, result.getPointsDelta());
        assertEquals(10, result.getBalance());
        verify(pointLogMapper, times(1)).insert(any(PointLog.class));
        verify(appUserMapper, times(1)).addPoints(2L, 3);
    }

    @Test
    @DisplayName("同一回答的奖励只发一次")
    void rewardIsAwardedOnlyOnce() {
        when(questionMapper.selectById(1L)).thenReturn(question());
        when(answerMapper.countByQuestionAndAuthor(1L, 2L)).thenReturn(0);
        when(answerMapper.insert(any(Answer.class))).thenAnswer(invocation -> {
            Answer answer = invocation.getArgument(0);
            answer.setId(77L);
            return 1;
        });
        when(questionMapper.incrementAnswerCount(1L)).thenReturn(1);
        when(pointLogMapper.countBusiness(2L, "ANSWER_REWARD", 77L)).thenReturn(1);
        when(appUserMapper.selectBalance(2L)).thenReturn(10);

        AnswerResult result = questionService.answer(2L, 1L, form());

        assertEquals(0, result.getPointsDelta());
        assertEquals(10, result.getBalance());
        verify(pointLogMapper, never()).insert(any(PointLog.class));
        verify(appUserMapper, never()).addPoints(anyLong(), anyInt());
    }
}
