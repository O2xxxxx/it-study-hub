package com.itstudy.service;

import com.itstudy.dto.DraftForm;
import com.itstudy.dto.DraftView;

import java.util.List;

public interface DraftService {

    /** 按账号列出草稿，draftType 为空时返回全部类型。 */
    List<DraftView> list(Long userId, String draftType);

    /** 没有草稿时返回 null。 */
    DraftView get(Long userId, String draftType, String draftKey);

    DraftView save(Long userId, DraftForm form);

    void delete(Long userId, String draftType, String draftKey);
}
