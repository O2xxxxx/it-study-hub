package com.itstudy.service;

import com.itstudy.dto.DraftForm;
import com.itstudy.dto.DraftView;

public interface DraftService {

    /** 没有草稿时返回 null。 */
    DraftView get(Long userId, String draftType, String draftKey);

    DraftView save(Long userId, DraftForm form);

    void delete(Long userId, String draftType, String draftKey);
}
