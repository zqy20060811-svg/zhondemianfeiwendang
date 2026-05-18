package com.zhongde.doc.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("doc_share")
public class DocShare {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String docId;

    private String shareCode;

    private String permission;

    private LocalDateTime expireTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
