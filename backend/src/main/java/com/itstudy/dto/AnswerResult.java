package com.itstudy.dto;

import lombok.Data;

@Data
public class AnswerResult {

    private Long id;
    private Integer pointsDelta;
    private Integer balance;

    public static AnswerResult of(Long id, Integer pointsDelta, Integer balance) {
        AnswerResult result = new AnswerResult();
        result.setId(id);
        result.setPointsDelta(pointsDelta);
        result.setBalance(balance);
        return result;
    }
}
