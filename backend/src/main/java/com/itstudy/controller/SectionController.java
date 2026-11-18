package com.itstudy.controller;

import com.itstudy.dto.SectionView;
import com.itstudy.service.SectionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
public class SectionController {

    private final SectionService sectionService;

    public SectionController(SectionService sectionService) {
        this.sectionService = sectionService;
    }

    @GetMapping
    public List<SectionView> list() {
        return sectionService.list();
    }

    @GetMapping("/{code}")
    public SectionView byCode(@PathVariable String code) {
        return sectionService.byCode(code);
    }
}
