package com.zhongde.doc.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhongde.doc.entity.DocInfo;
import com.zhongde.doc.entity.RecycleBin;
import com.zhongde.doc.mapper.DocInfoMapper;
import com.zhongde.doc.mapper.RecycleBinMapper;
import com.zhongde.doc.service.DocService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DocServiceImpl implements DocService {

    private final DocInfoMapper docInfoMapper;
    private final RecycleBinMapper recycleBinMapper;
    private final RedisTemplate<String, String> redisTemplate;

    public DocServiceImpl(DocInfoMapper docInfoMapper, RecycleBinMapper recycleBinMapper, RedisTemplate<String, String> redisTemplate) {
        this.docInfoMapper = docInfoMapper;
        this.recycleBinMapper = recycleBinMapper;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public DocInfo create(Long userId, String title) {
        DocInfo doc = new DocInfo();
        doc.setId(UUID.randomUUID().toString().replace("-", ""));
        doc.setTitle(title);
        doc.setContent("");
        doc.setOwnerId(userId);
        doc.setVersion(1);
        doc.setStatus(1);
        LocalDateTime now = LocalDateTime.now();
        doc.setCreateTime(now);
        doc.setUpdateTime(now);
        docInfoMapper.insert(doc);
        return doc;
    }

    @Override
    public List<DocInfo> list(Long userId, String type, String keyword) {
        LambdaQueryWrapper<DocInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DocInfo::getOwnerId, userId);
        wrapper.eq(DocInfo::getStatus, 1);
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(DocInfo::getTitle, keyword);
        }
        wrapper.orderByDesc(DocInfo::getUpdateTime);
        return docInfoMapper.selectList(wrapper);
    }

    @Override
    public DocInfo getById(String docId) {
        DocInfo doc = docInfoMapper.selectById(docId);
        if (doc != null) {
            String content = redisTemplate.opsForValue().get("doc:content:" + docId);
            if (content != null) {
                doc.setContent(content);
            }
        }
        return doc;
    }

    @Override
    public void updateTitle(String docId, String title) {
        DocInfo doc = new DocInfo();
        doc.setId(docId);
        doc.setTitle(title);
        doc.setUpdateTime(LocalDateTime.now());
        docInfoMapper.updateById(doc);
    }

    @Override
    public void saveContent(String docId, String content) {
        DocInfo doc = new DocInfo();
        doc.setId(docId);
        doc.setContent(content);
        doc.setUpdateTime(LocalDateTime.now());
        docInfoMapper.updateById(doc);
        redisTemplate.opsForValue().set("doc:content:" + docId, content);
    }

    @Override
    public void delete(String docId) {
        DocInfo doc = docInfoMapper.selectById(docId);
        if (doc == null) return;

        RecycleBin bin = new RecycleBin();
        bin.setDocId(docId);
        bin.setTitle(doc.getTitle());
        bin.setOwnerId(doc.getOwnerId());
        bin.setDeleteTime(LocalDateTime.now());
        bin.setExpireTime(LocalDateTime.now().plusDays(30));
        recycleBinMapper.insert(bin);

        doc.setStatus(0);
        docInfoMapper.updateById(doc);
    }

    @Override
    public void restore(String docId) {
        DocInfo doc = new DocInfo();
        doc.setId(docId);
        doc.setStatus(1);
        docInfoMapper.updateById(doc);

        LambdaQueryWrapper<RecycleBin> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RecycleBin::getDocId, docId);
        recycleBinMapper.delete(wrapper);
    }

    @Override
    public void permanentDelete(String docId) {
        docInfoMapper.deleteById(docId);
        LambdaQueryWrapper<RecycleBin> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RecycleBin::getDocId, docId);
        recycleBinMapper.delete(wrapper);
        redisTemplate.delete("doc:content:" + docId);
        redisTemplate.delete("doc:version:" + docId);
    }
}
