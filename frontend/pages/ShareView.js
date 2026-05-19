import store from '../store.js';

export default {
    template: `
        <div class="edit-layout">
            <div class="edit-header">
                <div class="edit-header-left">
                    <span class="link" @click="$router.push('/docs')">返回</span>
                    <span class="edit-title">{{ title }}</span>
                    <span class="save-status">{{ permission === 'EDIT' ? '可编辑' : '仅查看' }}</span>
                </div>
                <div class="edit-header-right" v-if="permission === 'EDIT'">
                    <button class="btn-primary" @click="saveDoc">保存</button>
                </div>
            </div>
            <div class="edit-body">
                <div class="editor-left">
                    <textarea ref="editorTextarea" class="edit-textarea" v-model="content" @input="onEdit" :readonly="permission !== 'EDIT'" placeholder="开始写作..."></textarea>
                </div>
                <div class="editor-right">
                    <div class="preview-title">预览</div>
                    <div class="preview-content" v-html="previewHtml"></div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            shareCode: this.$route.params.code,
            docId: '',
            title: '',
            content: '',
            permission: 'VIEW',
            ws: null
        };
    },
    computed: {
        previewHtml() {
            return this.simpleMarkdownToHtml(this.content);
        }
    },
    async mounted() {
        await this.fetchShareDoc();
        if (this.permission === 'EDIT') {
            this.connectWebSocket();
        }
    },
    beforeUnmount() {
        if (this.ws) {
            this.ws.close();
        }
    },
    methods: {
        async fetchShareDoc() {
            try {
                const res = await store.request('/share/' + this.shareCode);
                if (res.code === 200 && res.data) {
                    this.docId = res.data.docId;
                    this.title = res.data.title;
                    this.content = res.data.content || '';
                    this.permission = res.data.permission || 'VIEW';
                } else {
                    alert(res.message || '分享链接无效');
                    this.$router.push('/docs');
                }
            } catch (e) {
                console.error('获取分享文档失败', e);
                alert('分享链接无效或已过期');
                this.$router.push('/docs');
            }
        },
        connectWebSocket() {
            const apiHost = window.API_BASE_URL ? window.API_BASE_URL.replace('http://', '').replace('https://', '') : 'localhost:8081';
            const wsProtocol = window.API_BASE_URL && window.API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
            const wsUrl = wsProtocol + '://' + apiHost + '/ws/doc/' + this.docId + '?token=' + store.token;
            this.ws = new WebSocket(wsUrl);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === 'EDIT' && msg.operation && msg.operation.content !== undefined) {
                    this.content = msg.operation.content;
                }
            };
        },
        onEdit() {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'EDIT',
                    docId: this.docId,
                    operation: { type: 'CONTENT', content: this.content }
                }));
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
            }
        },
        simpleMarkdownToHtml(md) {
            if (!md) return '';
            let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
            html = html.replace(/\n/gim, '<br>');
            return html;
        }
    }
};
