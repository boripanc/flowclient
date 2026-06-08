<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import WorkflowEditor from '@/components/WorkflowEditor.vue'
import Sidebar from '@/components/Sidebar.vue'
import PropertiesPanel from '@/components/PropertiesPanel.vue'
import TopBar from '@/components/TopBar.vue'
import ExecutionPanel from '@/components/ExecutionPanel.vue'
import { useWorkflowStore } from '@/stores/workflow'
import { api } from '@/api'

const route = useRoute()
const store = useWorkflowStore()
const flowId = route.params.id as string | undefined

// Clear immediately in setup (synchronous) — before WorkflowEditor mounts
// and reads store.nodes for the first time
store.clearWorkflow()

const editorKey = computed(() => route.fullPath)

onMounted(async () => {
  if (flowId) {
    try {
      const res = await api.workflows.get(flowId)
      if (!res.ok) throw new Error('Failed to load workflow')
      const data = await res.json()
      const wf = data.workflow || data

      if (wf.nodes) store.nodes.push(...wf.nodes)
      if (wf.edges) store.edges.push(...wf.edges)
    } catch (e: any) {
      store.addLog('system', 'System', 'error', `Failed to load: ${e.message}`)
    }
  }
})
</script>

<template>
  <div class="app-layout">
    <TopBar :flow-id="flowId" />
    <div class="app-content">
      <Sidebar />
      <div class="main-area">
        <WorkflowEditor :key="editorKey" />
        <ExecutionPanel />
      </div>
      <PropertiesPanel v-if="store.selectedNode" />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
}

.app-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
