package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuestionDetail {

    private Long id;
    private int likeCount;
    private boolean likedByMe;
    private String title;
    private String summary;
    private String contentMd;
    private String contentHtml;
    private Boolean solved;
    private SectionBrief section;
    private AuthorBrief author;
    private Integer answerCount;
    private Long acceptedAnswerId;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean favorite;
    private Boolean canAccept;
    private Boolean canAnswer;
    private Long myAnswerId;
    private List<AnswerView> answers;
}
