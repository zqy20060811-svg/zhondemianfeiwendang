import store from '../store.js';

export default {
    template: `
        <div class="layout">
            <div class="sidebar">
                <div class="sidebar-logo">中德免费文档</div>
                <div class="sidebar-menu">
                    <div class="sidebar-menu-item" @click="$router.push('/docs')">
                        <span>我的文档</span>
                    </div>
                </div>
            </div>
            <div class="main-content">
                <div class="page-header">
                    <div class="page-title">历史版本 - {{ docTitle }}</div>
                    <button class="btn-secondary" @click="$router.push('/doc/' + docId)">返回编辑</button>
                </div>
                <div class="history-layout">
                    <div class="history-list">
                        <div class="history-item" 
                             v-for="v in versions" 
                             :key="v.version"
                             :class="{active: selectedVersion === v.version}"
                             @click="selectVersion(v.version)">
                            <div class="history-version">v{{ v.version }}</div>
                            <div class="history-editor">{{ v.editor }}</div>
                            <div class="history-time">{{ v.time }}</div>
                            <div class="history-desc">{{ v.desc }}</div>
                        </div>
                    </div>
                    <div class="history-preview">
                        <div class="history-preview-header">
                            <span>预览此版本</span>
                            <button class="btn-primary" @click="rollback" v-if="selectedVersion !== currentVersion">恢复此版本</button>
                        </div>
                        <div class="history-preview-content">
                            <pre>{{ previewContent }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            docId: this.$route.params.id,
            docTitle: '',
            currentVersion: 0,
            selectedVersion: 0,
            versions: [],
            previewContent: ''
        };
    },
    mounted() {
        this.fetchVersions();
    },
    methods: {
        async fetchVersions() {
            try {
                const res = await store.request('/doc/' + this.docId + '/versions');
                if (res.code === 200 && res.data) {
                    this.docTitle = res.data.docTitle || '';
                    this.currentVersion = res.data.currentVersion || 0;
                    this.versions = res.data.versions || [];
                    if (this.versions.length > 0) {
                        this.selectVersion(this.versions[0].version);
                    }
                }
            } catch (e) {
                console.error('获取版本列表失败', e);
            }
        },
        async selectVersion(v) {
            this.selectedVersion = v;
            try {
                const res = await store.request('/doc/' + this.docId + '/version/' + v);
                if (res.code === 200 && res.data) {
                    this.previewContent = res.data.content || '';
                }
            } catch (e) {
                console.error('获取版本内容失败', e);
            }
        },
        async rollback() {
            if (!confirm('确定恢复到此版本吗？')) return;
            try {
                const res = await store.request('/doc/' + this.docId + '/rollback', {
                    method: 'POST',
                    body: JSON.stringify({ version: this.selectedVersion })
                });
                if (res.code === 200) {
                    alert('已恢复至 v' + this.selectedVersion);
                    this.fetchVersions();
                }
            } catch (e) {
                console.error('回滚失败', e);
            }
        }
    }
};
