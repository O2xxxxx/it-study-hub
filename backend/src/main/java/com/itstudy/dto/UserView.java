package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserView {

    private Long id;
    private String username;
    private String nickname;
    private Integer avatarHue;
    private Integer points;
    private LocalDateTime createdAt;
}
