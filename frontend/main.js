const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import store from './store.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import DocList from './pages/DocList.js';
import DocEdit from './pages/DocEdit.js';
import DocShare from './pages/DocShare.js';
import DocHistory from './pages/DocHistory.js';
import UserProfile from './pages/UserProfile.js';
import RecycleBin from './pages/RecycleBin.js';

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login, meta: { guest: true } },
    { path: '/register', component: Register, meta: { guest: true } },
    { path: '/docs', component: DocList, meta: { auth: true } },
    { path: '/doc/:id', component: DocEdit, meta: { auth: true } },
    { path: '/doc/:id/share', component: DocShare, meta: { auth: true } },
    { path: '/doc/:id/history', component: DocHistory, meta: { auth: true } },
    { path: '/profile', component: UserProfile, meta: { auth: true } },
    { path: '/recycle', component: RecycleBin, meta: { auth: true } }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.meta.auth && !store.isLoggedIn()) {
        next('/login');
    } else if (to.meta.guest && store.isLoggedIn()) {
        next('/docs');
    } else {
        next();
    }
});

const App = {
    template: `<router-view></router-view>`
};

createApp(App).use(router).mount('#app');
