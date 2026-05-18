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
                    <div class="sidebar-menu-item" @click="$router.push('/docs')">
                        <span>与我协作</span>
                    </div>
                    <div class="sidebar-menu-item" @click="$router.push('/docs')">
                        <span>最近打开</span>
                    </div>
                    <div class="sidebar-menu-item active" @click="$router.push('/recycle')">
                        <span>回收站</span>
                    </div>
                </div>
            </div>
            <div class="main-content">
                <div class="page-header">
                    <div class="page-title">回收站</div>
                </div>
                <div class="recycle-table card">
                    <table>
                        <thead>
                            <tr>
                                <th>文档名称</th>
                                <th>删除时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in recycleList" :key="item.id">
                                <td>{{ item.title }}</td>
                                <td>{{ item.deleteTime }}</td>
                                <td>
                                    <button class="btn-text" @click="restore(item.id)">恢复</button>
                                    <button class="btn-text" style="color:#ff6b6b" @click="permanentDelete(item.id)">永久删除</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="empty-state" v-if="recycleList.length === 0">
                        回收站为空
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            recycleList: []
        };
    },
    mounted() {
        this.fetchList();
    },
    methods: {
        async fetchList() {
            try {
                const res = await store.request('/recycle/list');
                if (res.code === 200 && res.data) {
                    this.recycleList = res.data.list || [];
                }
            } catch (e) {
                console.error('获取回收站列表失败', e);
            }
        },
        async restore(id) {
            try {
                const res = await store.request('/recycle/' + id + '/restore', {
                    method: 'PUT'
                });
                if (res.code === 200) {
                    this.recycleList = this.recycleList.filter(i => i.id !== id);
                }
            } catch (e) {
                console.error('恢复失败', e);
            }
        },
        async permanentDelete(id) {
            if (!confirm('确定永久删除？此操作不可恢复。')) return;
            try {
                const res = await store.request('/recycle/' + id + '/permanent', {
                    method: 'DELETE'
                });
                if (res.code === 200) {
                    this.recycleList = this.recycleList.filter(i => i.id !== id);
                }
            } catch (e) {
                console.error('删除失败', e);
            }
        }
    }
};
