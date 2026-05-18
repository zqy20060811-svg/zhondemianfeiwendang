package com.zhongde.doc.config;

import com.zhongde.doc.websocket.DocWebSocketHandler;
import com.zhongde.doc.websocket.DocWebSocketHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final DocWebSocketHandler docWebSocketHandler;
    private final DocWebSocketHandshakeInterceptor handshakeInterceptor;

    public WebSocketConfig(DocWebSocketHandler docWebSocketHandler,
                           DocWebSocketHandshakeInterceptor handshakeInterceptor) {
        this.docWebSocketHandler = docWebSocketHandler;
        this.handshakeInterceptor = handshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(docWebSocketHandler, "/ws/doc/{docId}")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOrigins("*");
    }
}
