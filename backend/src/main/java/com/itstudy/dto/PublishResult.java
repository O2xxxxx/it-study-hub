package com.itstudy.dto;

import lombok.Data;

@Data
public class PublishResult {

    private Long id;
    private Integer pointsDelta;
    private Integer balance;

    public static PublishResult of(Long id, Integer pointsDelta, Integer balance) {
        PublishResult result = new PublishResult();
        result.setId(id);
        result.setPointsDelta(pointsDelta);
        result.setBalance(balance);
        return result;
    }
}
