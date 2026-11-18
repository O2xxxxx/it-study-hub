package com.itstudy.service;

import com.itstudy.common.PageResult;
import com.itstudy.dto.DownloadFile;
import com.itstudy.dto.ExchangeResult;
import com.itstudy.dto.ResourceCard;

public interface ResourceService {

    PageResult<ResourceCard> page(String sectionCode, Integer page, Integer size, Long userId);

    ResourceCard detail(Long id, Long userId);

    /** 兑换：事务内写兑换记录、条件扣减积分、写流水。 */
    ExchangeResult exchange(Long id, Long userId);

    /** 下载：仅已兑换用户，路径限制在 app.storage.resource-dir 内。 */
    DownloadFile download(Long id, Long userId);
}
