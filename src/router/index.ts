import { createRouter, createWebHistory } from 'vue-router'
import FlowListPage from '@/pages/FlowListPage.vue'
import FlowEditorPage from '@/pages/FlowEditorPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'flow-list',
      component: FlowListPage,
    },
    {
      path: '/editor',
      name: 'flow-editor-new',
      component: FlowEditorPage,
    },
    {
      path: '/editor/:id',
      name: 'flow-editor',
      component: FlowEditorPage,
    },
  ],
})

export default router
