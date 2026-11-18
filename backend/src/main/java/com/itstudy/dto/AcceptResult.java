package com.itstudy.dto;

import lombok.Data;

@Data
public class AcceptResult {

    private Long questionId;
    private Long acceptedAnswerId;
    private Boolean solved;

    public static AcceptResult of(Long questionId, Long acceptedAnswerId) {
        AcceptResult result = new AcceptResult();
        result.setQuestionId(questionId);
        result.setAcceptedAnswerId(acceptedAnswerId);
        result.setSolved(Boolean.TRUE);
        return result;
    }
}
