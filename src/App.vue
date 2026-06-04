<script setup lang="ts">
import WorkflowEditor from './components/WorkflowEditor.vue'
import Sidebar from './components/Sidebar.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import TopBar from './components/TopBar.vue'
import ExecutionPanel from './components/ExecutionPanel.vue'
import { useWorkflowStore } from './stores/workflow'

const store = useWorkflowStore()
</script>

<template>
  <div class="app-layout">
    <TopBar />
    <div class="app-content">
      <Sidebar />
      <div class="main-area">
        <WorkflowEditor />
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
  height: 100%;
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
