package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.dto.SectionView;
import com.itstudy.mapper.SectionMapper;
import com.itstudy.service.SectionService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SectionServiceImpl implements SectionService {

    private final SectionMapper sectionMapper;

    public SectionServiceImpl(SectionMapper sectionMapper) {
        this.sectionMapper = sectionMapper;
    }

    @Override
    public List<SectionView> list() {
        return sectionMapper.selectAllWithStats();
    }

    @Override
    public SectionView byCode(String code) {
        SectionView view = sectionMapper.selectByCodeWithStats(code);
        if (view == null) {
            throw BizException.notFound("版块不存在");
        }
        return view;
    }
}
