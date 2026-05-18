package com.zhongde.doc.controller;

import com.zhongde.doc.common.Result;
import com.zhongde.doc.entity.DocInfo;
import com.zhongde.doc.service.DocService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doc")
public class DocController {

    private final DocService docService;
    private final RedisTemplate<String, String> redisTemplate;

    public DocController(DocService docService, RedisTemplate<String, String> redisTemplate) {
        this.docService = docService;
        this.redisTemplate = redisTemplate;
    }

    @PostMapping("/create")
    public Result<Map<String, Object>> create(@RequestBody Map<String, String> params, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        DocInfo doc = docService.create(userId, params.get("title"));
        Map<String, Object> data = new HashMap<>();
        data.put("id", doc.getId());
        data.put("title", doc.getTitle());
        return Result.success(data);
    }

    @GetMapping("/list")
    public Result<Map<String, Object>> list(@RequestParam Map<String, String> params, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String type = params.get("type");
        String keyword = params.get("keyword");
        List<DocInfo> list = docService.list(userId, type, keyword);
        List<Map<String, Object>> docs = list.stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId());
            m.put("title", d.getTitle());
            m.put("updateTime", d.getUpdateTime());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> data = new HashMap<>();
        data.put("list", docs);
        return Result.success(data);
    }

    @GetMapping("/detail/{docId}")
    public Result<Map<String, Object>> detail(@PathVariable String docId) {
        DocInfo doc = docService.getById(docId);
        if (doc == null) {
            return Result.error("文档不存在");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("id", doc.getId());
        data.put("title", doc.getTitle());
        data.put("content", doc.getContent());
        data.put("version", doc.getVersion());
        return Result.success(data);
    }

    @PutMapping("/{docId}/title")
    public Result<Void> updateTitle(@PathVariable String docId, @RequestBody Map<String, String> params) {
        docService.updateTitle(docId, params.get("title"));
        return Result.success();
    }

    @DeleteMapping("/{docId}")
    public Result<Void> delete(@PathVariable String docId) {
        docService.delete(docId);
        return Result.success();
    }

    @PutMapping("/{docId}/restore")
    public Result<Void> restore(@PathVariable String docId) {
        docService.restore(docId);
        return Result.success();
    }

    @DeleteMapping("/{docId}/permanent")
    public Result<Void> permanentDelete(@PathVariable String docId) {
        docService.permanentDelete(docId);
        return Result.success();
    }

    @GetMapping("/{docId}/versions")
    public Result<Map<String, Object>> versions(@PathVariable String docId) {
        DocInfo doc = docService.getById(docId);
        Map<String, Object> data = new HashMap<>();
        data.put("docTitle", doc != null ? doc.getTitle() : "");
        data.put("currentVersion", doc != null ? doc.getVersion() : 0);
        data.put("versions", List.of());
        return Result.success(data);
    }

    @GetMapping("/{docId}/version/{version}")
    public Result<Map<String, Object>> versionDetail(@PathVariable String docId, @PathVariable Integer version) {
        Map<String, Object> data = new HashMap<>();
        data.put("content", "");
        return Result.success(data);
    }

    @PostMapping("/{docId}/rollback")
    public Result<Void> rollback(@PathVariable String docId, @RequestBody Map<String, Integer> params) {
        return Result.success();
    }
}
