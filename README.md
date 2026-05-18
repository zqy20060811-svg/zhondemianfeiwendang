# 中德免费文档 - 在线协同编辑平台

> 一个支持多人实时协同编辑的在线文档系统，算是本人实习期间捣鼓出来的一个小项目吧，主要想练练 WebSocket 和 Redis 这块。

## 项目简介

本项目是一个基于 WebSocket + Redis 的实时协同文档编辑平台，支持多人同时在线编辑同一篇文档，内容实时同步。后端采用 SpringBoot 架构，前端使用 Vue3 开发，整体技术栈比较主流，适合拿来当面试项目聊。

**核心功能亮点：**
- 多人实时协同编辑（基于 WebSocket 全文同步）
- 文档版本控制（每次保存自动生成版本号，存到 Redis）
- 在线人数实时显示 + 协作动态提示
- 主动保存 + 自动保存双保险
- JWT 身份认证，保证文档安全

## 技术栈

**后端：**
- SpringBoot 3.2.0
- WebSocket（Spring 原生实现）
- Redis（缓存 + 在线状态 + 版本历史）
- MySQL 8.0（文档持久化存储）
- MyBatis Plus（ORM 框架）
- JWT（身份认证）
- SLF4J + Logback（日志记录）

**前端：**
- Vue 3（Composition API）
- Vue Router 4（前端路由）
- 原生 WebSocket API（实时通信）
- Markdown 编辑器（textarea + 实时预览）

## 项目结构

```
zhondemianfeiwendang/
├── backend/                    # 后端 SpringBoot 项目
│   ├── src/main/java/com/zhongde/doc/
│   │   ├── controller/         # REST API 接口层
│   │   ├── service/            # 业务逻辑层
│   │   ├── entity/             # 实体类（对应数据库表）
│   │   ├── mapper/             # MyBatis Plus 数据访问层
│   │   ├── websocket/          # WebSocket 处理器 + 拦截器
│   │   ├── config/             # 项目配置类
│   │   ├── interceptor/        # JWT 认证拦截器
│   │   └── util/               # 工具类（JWT、ID生成等）
│   └── src/main/resources/
│       ├── application.yml     # 主配置文件（含占位符）
│       ├── application-local.yml  # 本地开发配置模板
│       └── mapper/             # XML 映射文件
├── frontend/                   # 前端 Vue3 项目（纯静态）
│   ├── index.html              # 入口页面（含 API 地址配置）
│   ├── main.js                 # Vue 应用入口
│   ├── store.js                # 全局状态管理 + 请求封装
│   ├── router.js               # 路由配置
│   ├── pages/                  # 页面组件
│   │   ├── Login.js            # 登录页
│   │   ├── DocList.js          # 文档列表
│   │   ├── DocEdit.js          # 文档编辑页（核心）
│   │   └── ...
│   └── styles/                 # CSS 样式文件
└── README.md                   # 本文件
```

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.8+
- MySQL 8.0+
- Redis 6.0+（本地无密码即可）
- Node.js（前端是静态文件，任意 HTTP 服务器均可）

### 1. 数据库初始化

先创建一个名为 `zhongdemianfeiwendang` 的数据库，然后执行以下建表语句（核心表）：

```sql
CREATE TABLE `doc_info` (
  `id` varchar(64) NOT NULL,
  `title` varchar(255) DEFAULT '未命名文档',
  `content` longtext,
  `owner_id` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `sys_user` (
  `id` bigint NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> 其他表（doc_collaborator、doc_version、recycle_bin 等）按需创建，项目能跑起来就行。

### 2. 后端配置

项目里的 `application.yml` 已经用占位符脱敏了，你需要：

1. 复制 `backend/src/main/resources/application-local.yml`
2. 填入你的真实数据库密码、JWT 密钥等
3. 启动时加上参数 `--spring.profiles.active=local`

或者直接在启动命令里传环境变量：

```bash
# Windows PowerShell
$env:MYSQL_PASSWORD="你的密码"
$env:JWT_SECRET="你的密钥"
mvn spring-boot:run

# Linux/Mac
export MYSQL_PASSWORD="你的密码"
export JWT_SECRET="你的密钥"
mvn spring-boot:run
```

### 3. 前端配置

前端是纯静态文件，打开 `frontend/index.html`，找到这段代码：

```html
<script>
    window.API_BASE_URL = 'http://localhost:8081';
</script>
```

改成你的后端地址即可。然后随便找个 HTTP 服务器跑起来：

```bash
# 用 Python 临时启个服务
cd frontend
python -m http.server 3000

# 或者用 Node 的 serve
npx serve .
```

### 4. 启动测试

1. 启动 Redis（默认端口 6379，无密码）
2. 启动 MySQL
3. 启动后端（端口 8081）
4. 启动前端（端口 3000）
5. 浏览器访问 `http://localhost:3000`

## 核心功能说明

### WebSocket 协同编辑流程

1. 用户进入文档编辑页，前端建立 WebSocket 连接：`ws://localhost:8081/ws/doc/{docId}?token=xxx`
2. 后端握手拦截器验证 JWT，把 userId 存入 Session
3. 连接成功后，后端将该用户加入文档的在线会话池，并广播 `USER_JOINED` 消息
4. 用户在 textarea 输入内容，触发 `@input` 事件，前端发送 `EDIT` 消息（携带全文内容）
5. 后端收到 `EDIT` 后，将内容写入 Redis 缓存，并广播给其他在线用户
6. 其他用户收到 `EDIT` 消息后，更新本地 textarea 内容，实现实时同步
7. 点击"保存"按钮时，前端发送 `SAVE` 消息，后端将内容持久化到 MySQL，并生成新版本号

### 版本控制机制

每次保存时，后端会：
1. 将文档内容写入 MySQL 的 `doc_info` 表
2. 用 Redis 自增命令 `INCR` 生成新版本号
3. 将版本内容存入 Redis Hash：`doc:versions:{docId} -> {version} -> {content, editorId, editTime}`

这样历史版本就存在 Redis 里了，后面可以做版本回滚功能。

## 注意事项

1. **当前是全文同步**，不是 OT/CRDT 局部同步。多人同时编辑同一位置时，后发送的内容会覆盖先发送的。演示的时候最好一个人打字，另一个人看着同步效果。
2. **Redis 不要设密码**，或者自己改 `application.yml` 加上密码配置。
3. **JWT 密钥一定要改**，别用默认的，不然谁都能伪造 token。
4. 前端 Markdown 预览是简易版，只支持基础语法（标题、加粗、斜体、代码块、链接、列表等），复杂的表格和公式不支持。

## 后续可扩展方向

- [ ] 接入阿里云 OSS 存储图片/附件
- [ ] 实现 OT 算法，支持真正的多人同时编辑不冲突
- [ ] 添加文档权限管理（只读、可编辑、可评论）
- [ ] 历史版本对比和回滚功能
- [ ] 评论和批注功能
- [ ] 文档导出（PDF、Word）

## 作者

实习生小白，正在努力学 Java 和前端，欢迎大佬指点。

项目仓库：https://github.com/zqy20060811-svg/zhondemianfeiwendang.git
