import store from '../store.js';

export default {
    template: `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-logo">中德免费文档</div>
                <div class="auth-title">欢迎回来</div>
                <div class="auth-form">
                    <div class="form-item">
                        <label>用户名</label>
                        <input type="text" class="input" v-model="form.username" placeholder="请输入用户名">
                    </div>
                    <div class="form-item">
                        <label>密码</label>
                        <input type="password" class="input" v-model="form.password" placeholder="请输入密码">
                    </div>
                    <div class="error-msg" v-if="error">{{ error }}</div>
                    <button class="btn-primary auth-btn" @click="login" :disabled="loading">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </div>
                <div class="auth-footer">
                    还没有账号？<span class="link" @click="goRegister">立即注册</span>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                password: ''
            },
            loading: false,
            error: ''
        };
    },
    methods: {
        async login() {
            if (!this.form.username || !this.form.password) {
                this.error = '请填写用户名和密码';
                return;
            }
            this.loading = true;
            this.error = '';
            try {
                const res = await store.request('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify(this.form)
                });
                if (res.code === 200 && res.data) {
                    store.setToken(res.data.token);
                    store.setUser(res.data);
                    this.$router.push('/docs');
                } else {
                    this.error = res.message || '登录失败';
                }
            } catch (e) {
                this.error = '网络错误，请稍后重试';
            } finally {
                this.loading = false;
            }
        },
        goRegister() {
            this.$router.push('/register');
        }
    }
};
