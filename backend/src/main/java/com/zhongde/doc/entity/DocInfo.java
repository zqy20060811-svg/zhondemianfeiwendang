package com.zhongde.doc.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("doc_info")
public class DocInfo {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    private String content;

    private Long ownerId;

    private Integer version;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
