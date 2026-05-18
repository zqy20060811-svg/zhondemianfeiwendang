import store from '../store.js';

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function simpleMarkdownToHtml(md) {
    if (!md) return '';
    let html = escapeHtml(md);
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/gim, '<del>$1</del>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/\n/gim, '<br>');
    return html;
}

export default {
    template: `
        <div class="edit-layout">
            <div class="edit-header">
                <div class="edit-header-left">
                    <span class="link" @click="$router.push('/docs')">返回</span>
                    <input class="edit-title" v-model="title" @blur="updateTitle" placeholder="未命名文档">
                    <span class="save-status">{{ saveStatus }}</span>
                </div>
                <div class="edit-header-right">
                    <div class="online-users">
                        <div class="avatar small" v-for="u in onlineUsers" :key="u.id" :style="{borderColor: u.color}">{{ u.name[0] }}</div>
                    </div>
                    <button class="btn-primary" @click="saveDoc">保存</button>
                    <button class="btn-secondary" @click="shareDoc">分享</button>
                    <button class="btn-secondary" @click="showHistory">历史版本</button>
                </div>
            </div>
            <div class="edit-body">
                <div class="editor-left">
                    <textarea ref="editorTextarea" class="edit-textarea" v-model="content" @input="onEdit" placeholder="开始写作... 支持 Markdown 语法"></textarea>
                </div>
                <div class="editor-right">
                    <div class="preview-title">预览</div>
                    <div class="preview-content" v-html="previewHtml"></div>
                </div>
            </div>
            <div class="edit-sidebar">
                <div class="panel-title">在线协作者 ({{ onlineUsers.length }})</div>
                <div class="user-item" v-for="u in onlineUsers" :key="u.id">
                    <div class="avatar" :style="{backgroundColor: u.color}">{{ u.name[0] }}</div>
                    <div class="user-info">
                        <div class="user-name">{{ u.name }} <span v-if="u.isMe">(你)</span></div>
                        <div class="user-status">{{ u.status }}</div>
                    </div>
                </div>
                <div class="panel-title" style="margin-top:20px">协作动态</div>
                <div class="activity-item" v-for="act in activities" :key="act.id">
                    <div class="activity-user" :style="{color: act.color}">{{ act.user }}</div>
                    <div class="activity-text">{{ act.text }}</div>
                    <div class="activity-time">{{ act.time }}</div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            docId: this.$route.params.id,
            title: '',
            content: '',
            saveStatus: '',
            onlineUsers: [],
            activities: [],
            ws: null,
            localVersion: 0,
            applyingRemoteChange: false
        };
    },
    computed: {
        previewHtml() {
            return simpleMarkdownToHtml(this.content);
        }
    },
    async mounted() {
        await this.fetchDetail();
        this.connectWebSocket();
    },
    beforeUnmount() {
        if (this.ws) {
            this.ws.close();
        }
    },
    methods: {
        async fetchDetail() {
            try {
                const res = await store.request('/doc/detail/' + this.docId);
                if (res.code === 200 && res.data) {
                    this.title = res.data.title;
                    this.localVersion = res.data.version || 0;
                    this.content = res.data.content || '';
                }
            } catch (e) {
                console.error('获取文档详情失败', e);
            }
        },
        onEdit() {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'EDIT',
                    docId: this.docId,
                    operation: {
                        type: 'CONTENT',
                        content: this.content,
                        version: this.localVersion
                    }
                }));
            }
            this.saveStatus = '保存中...';
        },
        connectWebSocket() {
            const apiHost = window.API_BASE_URL ? window.API_BASE_URL.replace('http://', '').replace('https://', '') : 'localhost:8081';
            const wsProtocol = window.API_BASE_URL && window.API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
            const wsUrl = wsProtocol + '://' + apiHost + '/ws/doc/' + this.docId + '?token=' + store.token;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.ws.send(JSON.stringify({
                    type: 'JOIN',
                    docId: this.docId
                }));
            };

            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                this.handleWsMessage(msg);
            };

            this.ws.onclose = () => {
                this.saveStatus = '连接已断开';
            };

            this.ws.onerror = () => {
                this.saveStatus = '连接错误';
            };
        },
        handleWsMessage(msg) {
            switch (msg.type) {
                case 'USER_JOINED':
                    if (!this.onlineUsers.find(u => u.id === msg.user.id)) {
                        const currentUserId = store.user?.id;
                        const isMe = String(msg.user.id) === String(currentUserId);
                        this.onlineUsers.push({ ...msg.user, isMe });
                        if (!isMe) {
                            this.activities.unshift({
                                id: Date.now(),
                                user: msg.user.name,
                                color: msg.user.color || '#4a90d9',
                                text: '加入了文档',
                                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            });
                        }
                    }
                    break;
                case 'USER_LEFT':
                    this.onlineUsers = this.onlineUsers.filter(u => u.id !== msg.userId);
                    break;
                case 'EDIT':
                    if (msg.userId !== store.user?.id) {
                        this.applyingRemoteChange = true;
                        this.content = msg.operation.content;
                        this.localVersion = msg.operation.version;
                        this.$nextTick(() => {
                            this.applyingRemoteChange = false;
                        });
                    }
                    break;
                case 'SAVED':
                    this.localVersion = msg.version;
                    this.saveStatus = '已自动保存 ' + msg.saveTime;
                    break;
                case 'ERROR':
                    this.saveStatus = msg.message;
                    break;
            }
        },
        async updateTitle() {
            try {
                await store.request('/doc/' + this.docId + '/title', {
                    method: 'PUT',
                    body: JSON.stringify({ title: this.title })
                });
            } catch (e) {
                console.error('更新标题失败', e);
            }
        },
        saveDoc() {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'SAVE',
                    docId: this.docId,
                    content: this.content,
                    title: this.title
                }));
                this.saveStatus = '保存中...';
            } else {
                this.saveStatus = '未连接，无法保存';
            }
        },
        shareDoc() {
            this.$router.push('/doc/' + this.docId + '/share');
        },
        showHistory() {
            this.$router.push('/doc/' + this.docId + '/history');
        }
    }
};
