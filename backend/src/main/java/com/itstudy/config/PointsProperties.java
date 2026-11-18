package com.itstudy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** app.points.* 配置。 */
@Data
@Component
@ConfigurationProperties(prefix = "app.points")
public class PointsProperties {

    /** 发布文章奖励（默认 5）。 */
    private int articlePublish = 5;

    /** 回答问题奖励（默认 3）。 */
    private int answerCreate = 3;
}
