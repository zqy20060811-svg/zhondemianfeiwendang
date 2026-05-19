package com.zhongde.doc.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhongde.doc.common.Result;
import com.zhongde.doc.entity.DocCollaborator;
import com.zhongde.doc.entity.DocInfo;
import com.zhongde.doc.entity.DocShare;
import com.zhongde.doc.entity.User;
import com.zhongde.doc.mapper.DocCollaboratorMapper;
import com.zhongde.doc.mapper.DocShareMapper;
import com.zhongde.doc.service.DocService;
import com.zhongde.doc.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
public class ShareController {

    private final DocService docService;
    private final DocShareMapper docShareMapper;
    private final DocCollaboratorMapper docCollaboratorMapper;
    private final UserService userService;

    public ShareController(DocService docService, DocShareMapper docShareMapper, DocCollaboratorMapper docCollaboratorMapper, UserService userService) {
        this.docService = docService;
        this.docShareMapper = docShareMapper;
        this.docCollaboratorMapper = docCollaboratorMapper;
        this.userService = userService;
    }

    @GetMapping("/api/doc/{docId}/share")
    public Result<Map<String, Object>> getShareInfo(@PathVariable String docId) {
        DocInfo doc = docService.getById(docId);
        LambdaQueryWrapper<DocShare> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DocShare::getDocId, docId);
        DocShare share = docShareMapper.selectOne(wrapper);
        if (share == null) {
            share = new DocShare();
            share.setDocId(docId);
            share.setShareCode(UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            share.setPermission("EDIT");
            share.setCreateTime(LocalDateTime.now());
            docShareMapper.insert(share);
        }

        LambdaQueryWrapper<DocCollaborator> cw = new LambdaQueryWrapper<>();
        cw.eq(DocCollaborator::getDocId, docId);
        List<DocCollaborator> cols = docCollaboratorMapper.selectList(cw);
        List<Map<String, Object>> collaborators = cols.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            User u = userService.getById(c.getUserId());
            m.put("id", c.getUserId());
            m.put("name", u != null ? u.getUsername() : "");
            m.put("permission", c.getPermission());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("title", doc != null ? doc.getTitle() : "");
        data.put("shareLink", "http://localhost:3000/#/share/" + share.getShareCode());
        data.put("permission", share.getPermission());
        data.put("collaborators", collaborators);
        return Result.success(data);
    }

    @PutMapping("/api/doc/{docId}/share")
    public Result<Void> setPermission(@PathVariable String docId, @RequestBody Map<String, String> params) {
        LambdaQueryWrapper<DocShare> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DocShare::getDocId, docId);
        DocShare share = docShareMapper.selectOne(wrapper);
        if (share != null) {
            share.setPermission(params.get("permission"));
            docShareMapper.updateById(share);
        }
        return Result.success();
    }

    @PostMapping("/api/doc/{docId}/share/invite")
    public Result<Void> invite(@PathVariable String docId, @RequestBody Map<String, String> params, HttpServletRequest request) {
        Long inviterId = (Long) request.getAttribute("userId");
        String username = params.get("username");
        User user = userService.getByUsername(username);
        if (user == null) {
            return Result.error("用户不存在");
        }
        DocCollaborator col = new DocCollaborator();
        col.setDocId(docId);
        col.setUserId(user.getId());
        col.setPermission(params.get("permission"));
        col.setInviterId(inviterId);
        col.setCreateTime(LocalDateTime.now());
        docCollaboratorMapper.insert(col);
        return Result.success();
    }

    @DeleteMapping("/api/doc/{docId}/share/collaborator/{userId}")
    public Result<Void> removeCollaborator(@PathVariable String docId, @PathVariable Long userId) {
        LambdaQueryWrapper<DocCollaborator> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DocCollaborator::getDocId, docId).eq(DocCollaborator::getUserId, userId);
        docCollaboratorMapper.delete(wrapper);
        return Result.success();
    }

    @GetMapping("/api/share/{code}")
    public Result<Map<String, Object>> getByShareCode(@PathVariable String code) {
        LambdaQueryWrapper<DocShare> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DocShare::getShareCode, code);
        DocShare share = docShareMapper.selectOne(wrapper);
        if (share == null) {
            return Result.error("分享链接无效或已过期");
        }
        DocInfo doc = docService.getById(share.getDocId());
        if (doc == null) {
            return Result.error("文档不存在");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("docId", share.getDocId());
        data.put("title", doc.getTitle());
        data.put("content", doc.getContent());
        data.put("permission", share.getPermission());
        return Result.success(data);
    }
}
