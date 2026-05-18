import store from '../store.js';

export default {
    template: `
        <div class="layout">
            <div class="sidebar">
                <div class="sidebar-logo">中德免费文档</div>
                <div class="sidebar-menu">
                    <div class="sidebar-menu-item" :class="{active: tab==='my'}" @click="switchTab('my')">
                        <span>我的文档</span>
                    </div>
                    <div class="sidebar-menu-item" :class="{active: tab==='collab'}" @click="switchTab('collab')">
                        <span>与我协作</span>
                    </div>
                    <div class="sidebar-menu-item" :class="{active: tab==='recent'}" @click="switchTab('recent')">
                        <span>最近打开</span>
                    </div>
                    <div class="sidebar-menu-item" @click="$router.push('/recycle')">
                        <span>回收站</span>
                    </div>
                </div>
                <div class="sidebar-user" @click="$router.push('/profile')">
                    <div class="avatar">{{ userName[0] }}</div>
                    <span>{{ userName }}</span>
                </div>
            </div>
            <div class="main-content">
                <div class="page-header">
                    <div class="page-title">{{ tabTitle }}</div>
                    <div class="header-actions">
                        <input class="input search-input" v-model="keyword" @input="onSearch" placeholder="搜索文档">
                        <button class="btn-primary" @click="createDoc">+ 新建文档</button>
                    </div>
                </div>
                <div class="doc-list" v-if="docList.length > 0">
                    <div class="doc-card" v-for="doc in docList" :key="doc.id" @click="openDoc(doc.id)">
                        <div class="doc-title">{{ doc.title }}</div>
                        <div class="doc-meta">
                            <span>{{ doc.lastModifyTime }}</span>
                            <div class="doc-avatars">
                                <div class="avatar small" v-for="u in doc.collaborators" :key="u.id">{{ u.name[0] }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="empty-state" v-else>
                    暂无文档
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            tab: 'my',
            keyword: '',
            docList: [],
            userName: store.user?.username || '用户'
        };
    },
    computed: {
        tabTitle() {
            const map = { my: '我的文档', collab: '与我协作', recent: '最近打开' };
            return map[this.tab] || '我的文档';
        }
    },
    mounted() {
        this.fetchList();
    },
    methods: {
        async fetchList() {
            try {
                const params = new URLSearchParams();
                params.append('type', this.tab);
                if (this.keyword) params.append('keyword', this.keyword);
                const res = await store.request('/doc/list?' + params.toString());
                if (res.code === 200 && res.data) {
                    this.docList = res.data.list || [];
                }
            } catch (e) {
                console.error('获取文档列表失败', e);
            }
        },
        switchTab(tab) {
            this.tab = tab;
            this.fetchList();
        },
        onSearch() {
            this.fetchList();
        },
        async createDoc() {
            try {
                const res = await store.request('/doc/create', {
                    method: 'POST',
                    body: JSON.stringify({ title: '未命名文档' })
                });
                if (res.code === 200 && res.data) {
                    this.$router.push('/doc/' + res.data.id);
                }
            } catch (e) {
                console.error('创建文档失败', e);
            }
        },
        openDoc(id) {
            this.$router.push('/doc/' + id);
        }
    }
};
