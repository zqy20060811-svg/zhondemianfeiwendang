package com.zhongde.doc.service;

import com.zhongde.doc.entity.User;

public interface UserService {
    User register(String username, String password, String email);
    User login(String username, String password);
    User getById(Long id);
    User getByUsername(String username);
    void updateProfile(Long userId, String username, String email);
}
