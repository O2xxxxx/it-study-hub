package com.itstudy.dto;

import lombok.Data;
import java.util.List;

@Data
public class PointSummary {

    private Integer balance;
    private Integer earned;
    private Integer spent;
    private List<PointLogView> logs;
    private List<ExchangeView> exchanges;
}
