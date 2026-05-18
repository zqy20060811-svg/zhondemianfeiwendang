# 中德免费文档 - 接口文档

## 基础信息

- **Base URL**: `http://localhost:8081/api`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token (Header: `Authorization: Bearer <token>`)

---

## 1. 用户认证模块

### 1.1 用户注册

- **POST** `/auth/register`

**请求参数**:

| 参数名   | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| username | string | 是   | 用户名   |
| password | string | 是   | 密码     |
| email    | string | 是   | 邮箱     |

**响应示例**:

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": "https://...",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.2 用户登录

- **POST** `/auth/login`

**请求参数**:

| 参数名   | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| username | string | 是   | 用户名 |
| password | string | 是   | 密码   |

**响应示例**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": "https://...",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.3 获取当前用户信息

- **GET** `/auth/me`

**请求头**: `Authorization: Bearer <token>`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": "https://...",
    "joinTime": "2024-03-01 10:00:00"
  }
}
```

---

## 2. 文档模块

### 2.1 创建文档

- **POST** `/doc/create`

**请求参数**:

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| title  | string | 是   | 文档标题 |

**响应示例**:

```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "doc_123456",
    "title": "未命名文档",
    "content": "",
    "createTime": "2024-03-20 10:30:00",
    "updateTime": "2024-03-20 10:30:00",
    "ownerId": 1
  }
}
```

### 2.2 获取文档列表

- **GET** `/doc/list`

**请求参数**:

| 参数名   | 类型   | 必填 | 说明                  |
| -------- | ------ | ---- | --------------------- |
| type     | string | 否   | 类型：my/collab/open  |
| keyword  | string | 否   | 搜索关键词            |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "doc_123456",
        "title": "产品需求文档",
        "lastModifyTime": "2024-03-20 10:30",
        "collaborators": [
          { "id": 1, "username": "张三", "avatar": "..." },
          { "id": 2, "username": "李四", "avatar": "..." }
        ]
      }
    ]
  }
}
```

### 2.3 获取文档详情

- **GET** `/doc/detail/{docId}`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "doc_123456",
    "title": "产品需求文档",
    "content": "# 1. 项目背景\n...",
    "ownerId": 1,
    "createTime": "2024-03-20 10:30:00",
    "updateTime": "2024-03-20 10:30:00",
    "collaborators": [
      { "id": 1, "username": "张三", "avatar": "...", "status": "editing" },
      { "id": 2, "username": "李四", "avatar": "...", "status": "viewing" }
    ]
  }
}
```

### 2.4 更新文档标题

- **PUT** `/doc/{docId}/title`

**请求参数**:

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| title  | string | 是   | 新标题   |

### 2.5 删除文档（移入回收站）

- **DELETE** `/doc/{docId}`

**响应示例**:

```json
{
  "code": 200,
  "message": "已移入回收站"
}
```

### 2.6 恢复文档

- **PUT** `/doc/{docId}/restore`

### 2.7 彻底删除文档

- **DELETE** `/doc/{docId}/permanent`

---

## 3. WebSocket 协同编辑模块

### 3.1 连接地址

- **WebSocket** `ws://localhost:8081/ws/doc/{docId}`

**连接头**: `Authorization: Bearer <token>`

### 3.2 消息类型

#### 客户端 -> 服务端

**加入文档**:

```json
{
  "type": "JOIN",
  "docId": "doc_123456"
}
```

**编辑操作**:

```json
{
  "type": "EDIT",
  "docId": "doc_123456",
  "operation": {
    "type": "INSERT" | "DELETE",
    "position": 100,
    "content": "插入的文本",
    "version": 5
  }
}
```

**光标位置**:

```json
{
  "type": "CURSOR",
  "docId": "doc_123456",
  "position": 150,
  "selection": { "start": 150, "end": 160 }
}
```

**保存文档**:

```json
{
  "type": "SAVE",
  "docId": "doc_123456",
  "content": "完整文档内容",
  "title": "文档标题"
}
```

#### 服务端 -> 客户端

**用户加入通知**:

```json
{
  "type": "USER_JOINED",
  "user": { "id": 2, "username": "李四", "avatar": "..." }
}
```

**编辑广播**:

```json
{
  "type": "EDIT",
  "userId": 2,
  "operation": {
    "type": "INSERT",
    "position": 100,
    "content": "插入的文本",
    "version": 5
  }
}
```

**光标广播**:

```json
{
  "type": "CURSOR",
  "userId": 2,
  "username": "李四",
  "color": "#FF6B6B",
  "position": 150
}
```

**用户离开**:

```json
{
  "type": "USER_LEFT",
  "userId": 2
}
```

**保存成功**:

```json
{
  "type": "SAVED",
  "version": 6,
  "saveTime": "2024-03-20 10:35:00"
}
```

**错误消息**:

```json
{
  "type": "ERROR",
  "message": "操作冲突，请刷新"
}
```

---

## 4. 文档版本模块

### 4.1 获取版本历史列表

- **GET** `/doc/{docId}/versions`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "currentVersion": 5,
    "versions": [
      {
        "version": 5,
        "editor": { "id": 1, "username": "张三" },
        "editTime": "2024-03-20 10:35:00",
        "changeDesc": "修改了第3行"
      },
      {
        "version": 4,
        "editor": { "id": 2, "username": "李四" },
        "editTime": "2024-03-20 10:21:00",
        "changeDesc": "插入了内容"
      }
    ]
  }
}
```

### 4.2 获取指定版本内容

- **GET** `/doc/{docId}/version/{version}`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "version": 4,
    "content": "# 1. 项目背景\n...",
    "editor": { "id": 2, "username": "李四" },
    "editTime": "2024-03-20 10:21:00"
  }
}
```

### 4.3 回滚到指定版本

- **POST** `/doc/{docId}/rollback`

**请求参数**:

| 参数名  | 类型 | 必填 | 说明       |
| ------- | ---- | ---- | ---------- |
| version | int  | 是   | 目标版本号 |

---

## 5. 文档分享模块

### 5.1 获取分享信息

- **GET** `/doc/{docId}/share`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "docId": "doc_123456",
    "title": "产品需求文档",
    "shareLink": "https://.../share/abc123",
    "permission": "EDIT",
    "collaborators": [
      { "id": 2, "username": "李四", "permission": "EDIT" },
      { "id": 3, "username": "王五", "permission": "VIEW" }
    ]
  }
}
```

### 5.2 设置分享权限

- **PUT** `/doc/{docId}/share`

**请求参数**:

| 参数名     | 类型   | 必填 | 说明                  |
| ---------- | ------ | ---- | --------------------- |
| permission | string | 是   | 权限：VIEW/EDIT       |

### 5.3 邀请协作者

- **POST** `/doc/{docId}/share/invite`

**请求参数**:

| 参数名     | 类型   | 必填 | 说明            |
| ---------- | ------ | ---- | --------------- |
| username   | string | 是   | 被邀请用户名    |
| permission | string | 是   | 权限：VIEW/EDIT |

### 5.4 移除协作者

- **DELETE** `/doc/{docId}/share/collaborator/{userId}`

---

## 6. 回收站模块

### 6.1 获取回收站列表

- **GET** `/recycle/list`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "doc_123456",
        "title": "旧需求文档",
        "deleteTime": "2024-03-20 14:30:00",
        "remainDays": 23
      }
    ]
  }
}
```

### 6.2 恢复文档

- **PUT** `/recycle/{docId}/restore`

### 6.3 彻底删除

- **DELETE** `/recycle/{docId}/permanent`

---

## 7. 个人中心模块

### 7.1 获取个人信息

- **GET** `/user/profile`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": "https://...",
    "joinTime": "2024-03-01 10:00:00"
  }
}
```

### 7.2 修改个人信息

- **PUT** `/user/profile`

**请求参数**:

| 参数名   | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| username | string | 否   | 用户名 |
| email    | string | 否   | 邮箱   |
| avatar   | string | 否   | 头像   |

### 7.3 修改密码

- **PUT** `/user/password`

**请求参数**:

| 参数名      | 类型   | 必填 | 说明     |
| ----------- | ------ | ---- | -------- |
| oldPassword | string | 是   | 旧密码   |
| newPassword | string | 是   | 新密码   |

---

## 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**状态码说明**:

| 状态码 | 说明       |
| ------ | ---------- |
| 200    | 成功       |
| 400    | 参数错误   |
| 401    | 未授权     |
| 403    | 无权限     |
| 404    | 资源不存在 |
| 500    | 服务器错误 |
