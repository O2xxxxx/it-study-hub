package com.itstudy.dto;

import lombok.Data;

@Data
public class IdResult {

    private Long id;

    public static IdResult of(Long id) {
        IdResult result = new IdResult();
        result.setId(id);
        return result;
    }
}
