import store from '../store.js';

export default {
    template: `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-logo">中德免费文档</div>
                <div class="auth-title">创建账号</div>
                <div class="auth-form">
                    <div class="form-item">
                        <label>用户名</label>
                        <input type="text" class="input" v-model="form.username" placeholder="请输入用户名">
                    </div>
                    <div class="form-item">
                        <label>邮箱</label>
                        <input type="email" class="input" v-model="form.email" placeholder="请输入邮箱">
                    </div>
                    <div class="form-item">
                        <label>密码</label>
                        <input type="password" class="input" v-model="form.password" placeholder="请输入密码">
                    </div>
                    <div class="error-msg" v-if="error">{{ error }}</div>
                    <button class="btn-primary auth-btn" @click="register" :disabled="loading">
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </div>
                <div class="auth-footer">
                    已有账号？<span class="link" @click="goLogin">立即登录</span>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                email: '',
                password: ''
            },
            loading: false,
            error: ''
        };
    },
    methods: {
        async register() {
            if (!this.form.username || !this.form.email || !this.form.password) {
                this.error = '请填写所有字段';
                return;
            }
            this.loading = true;
            this.error = '';
            try {
                const res = await store.request('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(this.form)
                });
                if (res.code === 200 && res.data) {
                    store.setToken(res.data.token);
                    store.setUser(res.data);
                    this.$router.push('/docs');
                } else {
                    this.error = res.message || '注册失败';
                }
            } catch (e) {
                this.error = '网络错误，请稍后重试';
            } finally {
                this.loading = false;
            }
        },
        goLogin() {
            this.$router.push('/login');
        }
    }
};
