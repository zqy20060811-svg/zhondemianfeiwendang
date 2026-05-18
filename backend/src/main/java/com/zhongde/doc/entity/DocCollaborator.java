package com.zhongde.doc.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("doc_collaborator")
public class DocCollaborator {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String docId;

    private Long userId;

    private String permission;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
