package com.zhongde.doc.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("recycle_bin")
public class RecycleBin {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String docId;

    private String title;

    private Long ownerId;

    private LocalDateTime deleteTime;

    private LocalDateTime expireTime;
}
