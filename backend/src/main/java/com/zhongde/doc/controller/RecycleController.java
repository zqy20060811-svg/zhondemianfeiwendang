package com.zhongde.doc.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhongde.doc.common.Result;
import com.zhongde.doc.entity.RecycleBin;
import com.zhongde.doc.mapper.RecycleBinMapper;
import com.zhongde.doc.service.DocService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recycle")
public class RecycleController {

    private final RecycleBinMapper recycleBinMapper;
    private final DocService docService;

    public RecycleController(RecycleBinMapper recycleBinMapper, DocService docService) {
        this.recycleBinMapper = recycleBinMapper;
        this.docService = docService;
    }

    @GetMapping("/list")
    public Result<Map<String, Object>> list(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        LambdaQueryWrapper<RecycleBin> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RecycleBin::getOwnerId, userId);
        wrapper.orderByDesc(RecycleBin::getDeleteTime);
        List<RecycleBin> list = recycleBinMapper.selectList(wrapper);
        List<Map<String, Object>> items = list.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getDocId());
            m.put("title", r.getTitle());
            m.put("deleteTime", r.getDeleteTime());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> data = new HashMap<>();
        data.put("list", items);
        return Result.success(data);
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
}
