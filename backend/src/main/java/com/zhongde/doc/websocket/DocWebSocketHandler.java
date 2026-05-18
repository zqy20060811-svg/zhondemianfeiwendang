package com.zhongde.doc.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhongde.doc.service.DocService;
import com.zhongde.doc.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class DocWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RedisTemplate<String, Object> redisTemplate;
    private final DocService docService;
    private final JwtUtil jwtUtil;

    private static final Map<String, Map<String, WebSocketSession>> docSessions = new ConcurrentHashMap<>();

    public DocWebSocketHandler(RedisTemplate<String, Object> redisTemplate, DocService docService, JwtUtil jwtUtil) {
        this.redisTemplate = redisTemplate;
        this.docService = docService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String docId = getDocId(session);
        String userId = getUserId(session);
        if (docId == null || userId == null) {
            session.close();
            return;
        }

        docSessions.computeIfAbsent(docId, k -> new ConcurrentHashMap<>()).put(userId, session);

        String userInfo = (String) redisTemplate.opsForHash().get("doc:online:" + docId, userId);
        if (userInfo == null) {
            userInfo = "{\"id\":\"" + userId + "\",\"name\":\"用户" + userId + "\",\"color\":\"#4a90d9\",\"status\":\"editing\"}";
            redisTemplate.opsForHash().put("doc:online:" + docId, userId, userInfo);
        }

        Map<String, WebSocketSession> sessions = docSessions.get(docId);
        if (sessions != null) {
            for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
                if (!entry.getKey().equals(userId) && entry.getValue().isOpen()) {
                    String otherUserInfo = (String) redisTemplate.opsForHash().get("doc:online:" + docId, entry.getKey());
                    if (otherUserInfo != null) {
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                                Map.of("type", "USER_JOINED", "user", objectMapper.readValue(otherUserInfo, Map.class)))));
                    }
                }
            }
        }

        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                Map.of("type", "USER_JOINED", "user", objectMapper.readValue(userInfo, Map.class)))));
        broadcast(docId, Map.of("type", "USER_JOINED", "user", objectMapper.readValue(userInfo, Map.class)), userId);
        log.info("User {} joined doc {}", userId, docId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String docId = getDocId(session);
        String userId = getUserId(session);
        if (docId == null || userId == null) return;

        Map<String, Object> msg = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) msg.get("type");

        switch (type) {
            case "EDIT":
                handleEdit(docId, userId, msg);
                break;
            case "SAVE":
                handleSave(docId, userId, msg);
                break;
            default:
                break;
        }
    }

    private void handleEdit(String docId, String userId, Map<String, Object> msg) throws IOException {
        Map<String, Object> operation = (Map<String, Object>) msg.get("operation");
        if (operation == null) return;

        String content = (String) operation.get("content");
        if (content != null) {
            redisTemplate.opsForValue().set("doc:content:" + docId, content);
        }

        Map<String, Object> broadcastMsg = Map.of(
                "type", "EDIT",
                "userId", userId,
                "operation", operation
        );
        broadcast(docId, broadcastMsg, userId);
    }

    private void handleSave(String docId, String userId, Map<String, Object> msg) throws IOException {
        String content = (String) msg.get("content");
        String title = (String) msg.get("title");

        if (content != null) {
            docService.saveContent(docId, content);
        }
        if (title != null) {
            docService.updateTitle(docId, title);
        }

        Long version = redisTemplate.opsForValue().increment("doc:version:" + docId);
        if (version == null) version = 1L;

        String versionKey = "doc:versions:" + docId;
        String versionData = "{\"content\":\"" + (content != null ? content.replace("\"", "\\\"") : "") + "\",\"editorId\":" + userId + ",\"editTime\":\"" + java.time.LocalDateTime.now() + "\"}";
        redisTemplate.opsForHash().put(versionKey, String.valueOf(version), versionData);

        broadcast(docId, Map.of("type", "SAVED", "version", version, "saveTime", java.time.LocalDateTime.now().toString()));
        log.info("Doc {} saved by user {}, version {}", docId, userId, version);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String docId = getDocId(session);
        String userId = getUserId(session);
        if (docId == null || userId == null) return;

        Map<String, WebSocketSession> sessions = docSessions.get(docId);
        if (sessions != null) {
            sessions.remove(userId);
            if (sessions.isEmpty()) {
                docSessions.remove(docId);
            }
        }

        redisTemplate.opsForHash().delete("doc:online:" + docId, userId);
        broadcast(docId, Map.of("type", "USER_LEFT", "userId", userId));
        log.info("User {} left doc {}", userId, docId);
    }

    private void broadcast(String docId, Map<String, Object> msg) throws IOException {
        broadcast(docId, msg, null);
    }

    private void broadcast(String docId, Map<String, Object> msg, String excludeUserId) throws IOException {
        Map<String, WebSocketSession> sessions = docSessions.get(docId);
        if (sessions == null) return;

        String payload = objectMapper.writeValueAsString(msg);
        for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
            if (excludeUserId != null && excludeUserId.equals(entry.getKey())) continue;
            WebSocketSession s = entry.getValue();
            if (s.isOpen()) {
                s.sendMessage(new TextMessage(payload));
            }
        }
    }

    private String getDocId(WebSocketSession session) {
        String path = session.getUri().getPath();
        String[] parts = path.split("/");
        return parts.length > 0 ? parts[parts.length - 1] : null;
    }

    private String getUserId(WebSocketSession session) {
        Object userId = session.getAttributes().get("userId");
        if (userId != null) {
            return userId.toString();
        }
        String query = session.getUri().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                if (param.startsWith("token=")) {
                    String token = param.substring(6);
                    Long uid = jwtUtil.getUserId(token);
                    if (uid != null) {
                        return String.valueOf(uid);
                    }
                }
            }
        }
        return null;
    }
}
