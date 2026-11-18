package com.itstudy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("section")
public class Section {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private String name;
    private String tagline;
    private String description;
    private String icon;
    private String accent;
    private Integer sortOrder;
}
