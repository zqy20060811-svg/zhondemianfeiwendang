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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doc/{docId}/share")
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

    @GetMapping
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
        data.put("shareLink", "http://localhost:8080/share/" + share.getShareCode());
        data.put("permission", share.getPermission());
        data.put("collaborators", collaborators);
        return Result.success(data);
    }

    @PutMapping
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

    @PostMapping("/invite")
    public Result<Void> invite(@PathVariable String docId, @RequestBody Map<String, String> params) {
        String username = params.get("username");
        User user = userService.getById(1L);
        if (user == null) {
            return Result.error("用户不存在");
        }
        DocCollaborator col = new DocCollaborator();
        col.setDocId(docId);
        col.setUserId(user.getId());
        col.setPermission(params.get("permission"));
        docCollaboratorMapper.insert(col);
        return Result.success();
    }

    @DeleteMapping("/collaborator/{userId}")
    public Result<Void> removeCollaborator(@PathVariable String docId, @PathVariable Long userId) {
        LambdaQueryWrapper<DocCollaborator> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DocCollaborator::getDocId, docId).eq(DocCollaborator::getUserId, userId);
        docCollaboratorMapper.delete(wrapper);
        return Result.success();
    }
}
