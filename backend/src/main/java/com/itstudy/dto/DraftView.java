package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DraftView {

    private String draftType;
    private String draftKey;
    private String title;
    private Long sectionId;
    private String contentMd;
    private LocalDateTime updatedAt;
}
