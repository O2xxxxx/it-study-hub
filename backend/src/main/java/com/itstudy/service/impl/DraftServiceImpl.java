package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.dto.DraftForm;
import com.itstudy.dto.DraftView;
import com.itstudy.entity.Draft;
import com.itstudy.mapper.DraftMapper;
import com.itstudy.service.DraftService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DraftServiceImpl implements DraftService {

    private final DraftMapper draftMapper;

    public DraftServiceImpl(DraftMapper draftMapper) {
        this.draftMapper = draftMapper;
    }

    @Override
    public List<DraftView> list(Long userId, String draftType) {
        String type = draftType == null || draftType.isBlank() ? null : draftType.trim();
        if (type != null && !"article".equals(type) && !"question".equals(type)) {
            throw BizException.validation("draftType 只能是 article 或 question");
        }
        return draftMapper.selectByUserAndType(userId, type).stream().map(this::toView).toList();
    }

    @Override
    public DraftView get(Long userId, String draftType, String draftKey) {
        Draft draft = draftMapper.selectBySlot(userId, draftType, draftKey);
        return draft == null ? null : toView(draft);
    }

    @Override
    public DraftView save(Long userId, DraftForm form) {
        draftMapper.upsert(userId, form.getDraftType(), form.getDraftKey(),
                form.getTitle(), form.getSectionId(),
                form.getContentMd() == null ? "" : form.getContentMd());
        Draft draft = draftMapper.selectBySlot(userId, form.getDraftType(), form.getDraftKey());
        return draft == null ? null : toView(draft);
    }

    @Override
    public void delete(Long userId, String draftType, String draftKey) {
        draftMapper.deleteBySlot(userId, draftType, draftKey);
    }

    private DraftView toView(Draft draft) {
        DraftView view = new DraftView();
        view.setDraftType(draft.getDraftType());
        view.setDraftKey(draft.getDraftKey());
        view.setTitle(draft.getTitle());
        view.setSectionId(draft.getSectionId());
        view.setContentMd(draft.getContentMd());
        view.setUpdatedAt(draft.getUpdatedAt());
        return view;
    }
}
