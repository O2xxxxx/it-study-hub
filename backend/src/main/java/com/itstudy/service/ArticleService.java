package com.itstudy.service;

import com.itstudy.common.PageResult;
import com.itstudy.dto.ArticleCard;
import com.itstudy.dto.ArticleDetail;
import com.itstudy.dto.ArticleForm;
import com.itstudy.dto.PublishResult;

public interface ArticleService {

    PageResult<ArticleCard> page(String sectionCode, Integer page, Integer size, String sort, Long authorId, Long userId);

    ArticleDetail detail(Long id, Long userId);

    /** 发布文章：事务内写文章 + 一次性积分奖励。 */
    PublishResult publish(Long userId, ArticleForm form);

    /** 编辑文章：仅作者，积分不变。 */
    PublishResult update(Long id, Long userId, ArticleForm form);

    void delete(Long id, Long userId);
}
