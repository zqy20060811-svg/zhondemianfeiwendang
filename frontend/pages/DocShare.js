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
                    <div class="page-title">分享文档</div>
                    <button class="btn-secondary" @click="$router.push('/doc/' + docId)">返回编辑</button>
                </div>
                <div class="card share-card">
                    <div class="share-doc-title">{{ docTitle }}</div>
                    <div class="share-section">
                        <div class="section-label">分享链接</div>
                        <div class="share-link-row">
                            <input class="input" :value="shareLink" readonly>
                            <button class="btn-primary" @click="copyLink">复制链接</button>
                        </div>
                    </div>
                    <div class="share-section">
                        <div class="section-label">分享权限</div>
                        <div class="permission-options">
                            <label class="permission-option" :class="{active: permission==='VIEW'}">
                                <input type="radio" v-model="permission" value="VIEW" @change="updatePermission">
                                <span>获得链接的人可查看</span>
                            </label>
                            <label class="permission-option" :class="{active: permission==='EDIT'}">
                                <input type="radio" v-model="permission" value="EDIT" @change="updatePermission">
                                <span>获得链接的人可编辑</span>
                            </label>
                        </div>
                    </div>
                    <div class="share-section">
                        <div class="section-label">邀请协作者</div>
                        <div class="invite-row">
                            <input class="input" v-model="inviteName" placeholder="输入用户名或邮箱">
                            <select class="input" v-model="invitePermission" style="width:120px">
                                <option value="EDIT">可编辑</option>
                                <option value="VIEW">可查看</option>
                            </select>
                            <button class="btn-primary" @click="invite">邀请</button>
                        </div>
                    </div>
                    <div class="share-section">
                        <div class="section-label">已邀请</div>
                        <div class="collaborator-list">
                            <div class="collaborator-item" v-for="c in collaborators" :key="c.id">
                                <div class="avatar">{{ c.name[0] }}</div>
                                <div class="collaborator-info">
                                    <div class="collaborator-name">{{ c.name }}</div>
                                    <div class="collaborator-permission">{{ c.permission === 'EDIT' ? '可编辑' : '可查看' }}</div>
                                </div>
                                <button class="btn-text" @click="removeCollaborator(c.id)">移除</button>
                            </div>
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
            shareLink: '',
            permission: 'EDIT',
            inviteName: '',
            invitePermission: 'EDIT',
            collaborators: []
        };
    },
    mounted() {
        this.fetchShareInfo();
    },
    methods: {
        async fetchShareInfo() {
            try {
                const res = await store.request('/doc/' + this.docId + '/share');
                if (res.code === 200 && res.data) {
                    this.docTitle = res.data.title;
                    this.shareLink = res.data.shareLink;
                    this.permission = res.data.permission;
                    this.collaborators = res.data.collaborators || [];
                }
            } catch (e) {
                console.error('获取分享信息失败', e);
            }
        },
        copyLink() {
            navigator.clipboard.writeText(this.shareLink);
            alert('链接已复制');
        },
        async updatePermission() {
            try {
                await store.request('/doc/' + this.docId + '/share', {
                    method: 'PUT',
                    body: JSON.stringify({ permission: this.permission })
                });
            } catch (e) {
                console.error('更新权限失败', e);
            }
        },
        async invite() {
            if (!this.inviteName) return;
            try {
                const res = await store.request('/doc/' + this.docId + '/share/invite', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: this.inviteName,
                        permission: this.invitePermission
                    })
                });
                if (res.code === 200) {
                    this.inviteName = '';
                    this.fetchShareInfo();
                }
            } catch (e) {
                console.error('邀请失败', e);
            }
        },
        async removeCollaborator(userId) {
            try {
                const res = await store.request('/doc/' + this.docId + '/share/collaborator/' + userId, {
                    method: 'DELETE'
                });
                if (res.code === 200) {
                    this.collaborators = this.collaborators.filter(c => c.id !== userId);
                }
            } catch (e) {
                console.error('移除失败', e);
            }
        }
    }
};
