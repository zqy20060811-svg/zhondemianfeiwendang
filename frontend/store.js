const store = {
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    },

    setUser(user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    },

    clear() {
        this.token = '';
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    isLoggedIn() {
        return !!this.token;
    },

    async request(url, options = {}) {
        const baseUrl = (window.API_BASE_URL || 'http://localhost:8081') + '/api';
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (this.token) {
            headers['Authorization'] = 'Bearer ' + this.token;
        }
        const res = await fetch(baseUrl + url, {
            ...options,
            headers
        });
        return res.json();
    }
};

export default store;
