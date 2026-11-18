package com.itstudy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class DraftForm {

    @NotBlank(message = "draftType 不能为空")
    @Pattern(regexp = "article|question", message = "draftType 只能是 article 或 question")
    private String draftType;

    @NotBlank(message = "draftKey 不能为空")
    private String draftKey;

    private String title;

    private Long sectionId;

    private String contentMd;
}
