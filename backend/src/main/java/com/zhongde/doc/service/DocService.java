package com.zhongde.doc.service;

import com.zhongde.doc.entity.DocInfo;

import java.util.List;

public interface DocService {
    DocInfo create(Long userId, String title);
    List<DocInfo> list(Long userId, String type, String keyword);
    DocInfo getById(String docId);
    void updateTitle(String docId, String title);
    void saveContent(String docId, String content);
    void delete(String docId);
    void restore(String docId);
    void permanentDelete(String docId);
}
