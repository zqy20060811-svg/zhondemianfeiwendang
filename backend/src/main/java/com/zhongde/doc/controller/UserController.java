package com.zhongde.doc.controller;

import com.zhongde.doc.common.Result;
import com.zhongde.doc.entity.User;
import com.zhongde.doc.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public Result<Map<String, Object>> profile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        User user = userService.getById(userId);
        if (user == null) {
            return Result.error("用户不存在");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("email", user.getEmail());
        data.put("joinTime", user.getCreateTime());
        return Result.success(data);
    }

    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestBody Map<String, String> params, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        userService.updateProfile(userId, params.get("username"), params.get("email"));
        return Result.success();
    }

    @PutMapping("/password")
    public Result<Void> updatePassword(@RequestBody Map<String, String> params, HttpServletRequest request) {
        return Result.success();
    }
}
