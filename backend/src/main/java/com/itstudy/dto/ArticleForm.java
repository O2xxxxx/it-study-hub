package com.itstudy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ArticleForm {

    @NotBlank(message = "标题不能为空")
    @Size(max = 120, message = "标题最长 120 个字符")
    private String title;

    @NotNull(message = "请选择版块")
    private Long sectionId;

    @Size(max = 300, message = "摘要最长 300 个字符")
    private String summary;

    @NotBlank(message = "正文不能为空")
    private String contentMd;
}
