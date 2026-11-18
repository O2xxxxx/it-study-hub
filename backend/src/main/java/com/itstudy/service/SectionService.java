package com.itstudy.service;

import com.itstudy.dto.SectionView;

import java.util.List;

public interface SectionService {

    List<SectionView> list();

    SectionView byCode(String code);
}
