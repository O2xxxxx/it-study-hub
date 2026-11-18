package com.itstudy.dto;

import lombok.Data;

@Data
public class ExchangeResult {

    private Boolean owned;
    private Integer pointsDelta;
    private Integer balance;
    private Long exchangeId;
    private Boolean alreadyOwned;
}
