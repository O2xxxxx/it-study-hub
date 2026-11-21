package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.common.ErrorCodes;
import com.itstudy.common.PageResult;
import com.itstudy.config.PointsProperties;
import com.itstudy.dto.AcceptForm;
import com.itstudy.dto.AcceptResult;
import com.itstudy.dto.AnswerForm;
import com.itstudy.dto.AnswerResult;
import com.itstudy.dto.AnswerView;
import com.itstudy.dto.AuthorBrief;
import com.itstudy.dto.PublishResult;
import com.itstudy.dto.QuestionCard;
import com.itstudy.dto.QuestionDetail;
import com.itstudy.dto.QuestionForm;
import com.itstudy.dto.SectionBrief;
import com.itstudy.entity.Answer;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.Question;
import com.itstudy.entity.Section;
import com.itstudy.mapper.AnswerMapper;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.PostLikeMapper;
import com.itstudy.mapper.FavoriteMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.QuestionMapper;
import com.itstudy.mapper.SectionMapper;
import com.itstudy.service.QuestionService;
import com.itstudy.util.MarkdownRenderer;
import com.itstudy.util.Pages;
import com.itstudy.util.PointAwarder;
import com.itstudy.util.TextUtil;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuestionServiceImpl implements QuestionService {

    public static final String REASON_ANSWER = "ANSWER_REWARD";

    private final QuestionMapper questionMapper;
    private final AnswerMapper answerMapper;
    private final SectionMapper sectionMapper;
    private final AppUserMapper appUserMapper;
    private final PostLikeMapper postLikeMapper;
    private final PointLogMapper pointLogMapper;
    private final FavoriteMapper favoriteMapper;
    private final MarkdownRenderer markdownRenderer;
    private final PointsProperties pointsProperties;

    public QuestionServiceImpl(QuestionMapper questionMapper,
                               AnswerMapper answerMapper,
                               SectionMapper sectionMapper,
                               AppUserMapper appUserMapper,
                              PostLikeMapper postLikeMapper,
                               PointLogMapper pointLogMapper,
                               FavoriteMapper favoriteMapper,
                               MarkdownRenderer markdownRenderer,
                               PointsProperties pointsProperties) {
        this.questionMapper = questionMapper;
        this.answerMapper = answerMapper;
        this.sectionMapper = sectionMapper;
        this.appUserMapper = appUserMapper;
        this.postLikeMapper = postLikeMapper;
        this.pointLogMapper = pointLogMapper;
        this.favoriteMapper = favoriteMapper;
        this.markdownRenderer = markdownRenderer;
        this.pointsProperties = pointsProperties;
    }

    @Override
    public PageResult<QuestionCard> pageByAuthor(String sectionCode, String filter, Integer page, Integer size, Long userId, Long authorId) {
        int p = Pages.page(page);
        int s = Pages.size(size, 10);
        long total = questionMapper.countCards(sectionCode, filter, authorId);
        if (total <= 0) {
            return new PageResult<>(List.of(), p, s, 0);
        }
        List<QuestionCard> items = questionMapper.selectCards(sectionCode, filter, authorId, userId, Pages.offset(p, s), s);
        return new PageResult<>(items, p, s, total);
    }

    @Override
    public QuestionDetail detail(Long id, Long userId) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw BizException.notFound("问题不存在");
        }
        questionMapper.incrementView(id);

        QuestionDetail detail = new QuestionDetail();
        detail.setId(question.getId());
        detail.setTitle(question.getTitle());
        detail.setContentMd(question.getContentMd());
        detail.setSummary(TextUtil.summarize(question.getContentMd(), 120));
        detail.setContentHtml(markdownRenderer.toHtml(question.getContentMd()));
        detail.setSolved(Boolean.TRUE.equals(question.getSolved()));
        detail.setAnswerCount(question.getAnswerCount() == null ? 0 : question.getAnswerCount());
        detail.setAcceptedAnswerId(question.getAcceptedAnswerId());
        detail.setViewCount((question.getViewCount() == null ? 0 : question.getViewCount()) + 1);
        detail.setCreatedAt(question.getCreatedAt());
        detail.setUpdatedAt(question.getUpdatedAt());

        SectionBrief section = new SectionBrief();
        Section sectionEntity = question.getSectionId() == null ? null : sectionMapper.selectById(question.getSectionId());
        if (sectionEntity != null) {
            section.setId(sectionEntity.getId());
            section.setCode(sectionEntity.getCode());
            section.setName(sectionEntity.getName());
            section.setAccent(sectionEntity.getAccent());
        }
        detail.setSection(section);

        AuthorBrief author = new AuthorBrief();
        AppUser authorEntity = question.getAuthorId() == null ? null : appUserMapper.selectById(question.getAuthorId());
        if (authorEntity != null) {
            author.setId(authorEntity.getId());
            author.setUsername(authorEntity.getUsername());
            author.setNickname(authorEntity.getNickname());
            author.setAvatarHue(authorEntity.getAvatarHue());
        }
        detail.setAuthor(author);
        detail.setLikeCount(question.getLikeCount() == null ? 0 : question.getLikeCount());
        detail.setLikedByMe(userId != null && postLikeMapper.existsLike(userId, "question", id));

        List<Answer> answers = answerMapper.selectByQuestion(id);
        Map<Long, AppUser> authors = loadAuthors(answers);
        List<AnswerView> answerViews = new ArrayList<>(answers.size());
        Long myAnswerId = null;
        for (Answer answer : answers) {
            AnswerView view = new AnswerView();
            view.setId(answer.getId());
            view.setContentMd(answer.getContentMd());
            view.setContentHtml(markdownRenderer.toHtml(answer.getContentMd()));
            view.setAccepted(Boolean.TRUE.equals(answer.getIsAccepted()));
            view.setCreatedAt(answer.getCreatedAt());
            boolean mine = userId != null && userId.equals(answer.getAuthorId());
            view.setIsMine(mine);
            AppUser answerAuthor = answer.getAuthorId() == null ? null : authors.get(answer.getAuthorId());
            AuthorBrief brief = new AuthorBrief();
            if (answerAuthor != null) {
                brief.setId(answerAuthor.getId());
                brief.setUsername(answerAuthor.getUsername());
                brief.setNickname(answerAuthor.getNickname());
                brief.setAvatarHue(answerAuthor.getAvatarHue());
            }
            view.setAuthor(brief);
            answerViews.add(view);
            if (mine && myAnswerId == null) {
                myAnswerId = answer.getId();
            }
        }
        detail.setAnswers(answerViews);
        detail.setMyAnswerId(myAnswerId);
        detail.setFavorite(isFavorited(userId, id));
        boolean isOwner = userId != null && userId.equals(question.getAuthorId());
        detail.setCanAccept(isOwner && !Boolean.TRUE.equals(question.getSolved()));
        detail.setCanAnswer(userId != null && !isOwner && myAnswerId == null);
        return detail;
    }

    @Override
    @Transactional
    public PublishResult ask(Long userId, QuestionForm form) {
        requireSection(form.getSectionId());
        Question question = new Question();
        question.setSectionId(form.getSectionId());
        question.setAuthorId(userId);
        question.setTitle(form.getTitle().trim());
        question.setContentMd(form.getContentMd());
        question.setAnswerCount(0);
        question.setSolved(Boolean.FALSE);
        question.setViewCount(0);
        LocalDateTime now = LocalDateTime.now();
        question.setCreatedAt(now);
        question.setUpdatedAt(now);
        questionMapper.insert(question);
        return PublishResult.of(question.getId(), 0, balance(userId));
    }

    @Override
    @Transactional
    public AnswerResult answer(Long userId, Long questionId, AnswerForm form) {
        Question question = questionMapper.selectById(questionId);
        if (question == null) {
            throw BizException.notFound("问题不存在");
        }
        if (userId != null && userId.equals(question.getAuthorId())) {
            throw new BizException(ErrorCodes.CANNOT_ANSWER_OWN_QUESTION, HttpStatus.BAD_REQUEST, "不能回答自己的问题");
        }
        if (answerMapper.countByQuestionAndAuthor(questionId, userId) > 0) {
            throw BizException.conflict(ErrorCodes.DUPLICATE_ANSWER, "你已经回答过这个问题了");
        }
        Answer answer = new Answer();
        answer.setQuestionId(questionId);
        answer.setAuthorId(userId);
        answer.setContentMd(form.getContentMd());
        answer.setIsAccepted(Boolean.FALSE);
        answer.setCreatedAt(LocalDateTime.now());
        try {
            answerMapper.insert(answer);
        } catch (DuplicateKeyException ex) {
            throw BizException.conflict(ErrorCodes.DUPLICATE_ANSWER, "你已经回答过这个问题了");
        }
        questionMapper.incrementAnswerCount(questionId);
        int delta = PointAwarder.award(pointLogMapper, appUserMapper, userId,
                REASON_ANSWER,
                "回答问题《" + question.getTitle() + "》获得奖励",
                "answer",
                answer.getId(),
                pointsProperties.getAnswerCreate());
        return AnswerResult.of(answer.getId(), delta, balance(userId));
    }

    @Override
    @Transactional
    public AcceptResult accept(Long userId, Long questionId, AcceptForm form) {
        Question question = questionMapper.selectById(questionId);
        if (question == null) {
            throw BizException.notFound("问题不存在");
        }
        if (userId == null || !userId.equals(question.getAuthorId())) {
            throw BizException.forbidden("只有提问者可以采纳回答");
        }
        if (Boolean.TRUE.equals(question.getSolved()) || question.getAcceptedAnswerId() != null) {
            throw BizException.conflict(ErrorCodes.ALREADY_ACCEPTED, "该问题已经采纳过回答");
        }
        Answer answer = answerMapper.selectById(form.getAnswerId());
        if (answer == null) {
            throw BizException.notFound("回答不存在");
        }
        if (!questionId.equals(answer.getQuestionId())) {
            throw BizException.validation("该回答不属于这个问题");
        }
        if (questionMapper.markSolved(questionId, answer.getId()) == 0) {
            throw BizException.conflict(ErrorCodes.ALREADY_ACCEPTED, "该问题已经采纳过回答");
        }
        answerMapper.updateAccepted(answer.getId(), true);
        return AcceptResult.of(questionId, answer.getId());
    }

    private Map<Long, AppUser> loadAuthors(List<Answer> answers) {
        Map<Long, AppUser> result = new HashMap<>();
        List<Long> ids = answers.stream()
                .map(Answer::getAuthorId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return result;
        }
        for (AppUser user : appUserMapper.selectBatchIds(ids)) {
            result.put(user.getId(), user);
        }
        return result;
    }

    private boolean isFavorited(Long userId, Long questionId) {
        if (userId == null) {
            return false;
        }
        return favoriteMapper.selectOne(userId, "question", questionId) != null;
    }

    private int balance(Long userId) {
        Integer points = appUserMapper.selectBalance(userId);
        return points == null ? 0 : points;
    }

    private void requireSection(Long sectionId) {
        if (sectionId == null || sectionMapper.selectById(sectionId) == null) {
            throw BizException.validation("版块不存在");
        }
    }
}
