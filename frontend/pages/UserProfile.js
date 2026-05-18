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
                    <div class="page-title">个人中心</div>
                </div>
                <div class="profile-layout">
                    <div class="profile-menu">
                        <div class="profile-menu-item active">个人信息</div>
                        <div class="profile-menu-item">账号安全</div>
                        <div class="profile-menu-item">通知设置</div>
                        <div class="profile-menu-item">关于我们</div>
                    </div>
                    <div class="profile-content card">
                        <div class="profile-header">
                            <div class="avatar large">{{ user.username[0] }}</div>
                            <div>
                                <div class="profile-name">{{ user.username }}</div>
                                <div class="profile-email">{{ user.email }}</div>
                            </div>
                        </div>
                        <div class="form-item">
                            <label>用户名</label>
                            <input type="text" class="input" v-model="editForm.username">
                        </div>
                        <div class="form-item">
                            <label>邮箱</label>
                            <input type="email" class="input" v-model="editForm.email">
                        </div>
                        <div class="form-item">
                            <label>加入时间</label>
                            <div class="static-text">{{ user.joinTime }}</div>
                        </div>
                        <div class="profile-actions">
                            <button class="btn-primary" @click="saveProfile">保存修改</button>
                            <button class="btn-danger" @click="logout">退出登录</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            user: store.user || { username: '', email: '', joinTime: '' },
            editForm: {
                username: store.user?.username || '',
                email: store.user?.email || ''
            }
        };
    },
    methods: {
        async saveProfile() {
            try {
                const res = await store.request('/user/profile', {
                    method: 'PUT',
                    body: JSON.stringify(this.editForm)
                });
                if (res.code === 200) {
                    store.setUser({ ...this.user, ...this.editForm });
                    this.user = store.user;
                    alert('保存成功');
                }
            } catch (e) {
                console.error('保存失败', e);
            }
        },
        logout() {
            store.clear();
            this.$router.push('/login');
        }
    }
};
