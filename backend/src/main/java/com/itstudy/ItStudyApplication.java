package com.itstudy;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.itstudy.mapper")
public class ItStudyApplication {

    public static void main(String[] args) {
        SpringApplication.run(ItStudyApplication.class, args);
    }
}
