package com.zhongde.doc.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhongde.doc.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
