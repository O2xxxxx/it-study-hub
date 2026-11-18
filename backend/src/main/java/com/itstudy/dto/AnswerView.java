package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnswerView {

    private Long id;
    private String contentMd;
    private String contentHtml;
    private AuthorBrief author;
    private Boolean accepted;
    private LocalDateTime createdAt;
    private Boolean isMine;
}
