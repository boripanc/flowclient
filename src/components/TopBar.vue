<script setup lang="ts">
import { ref } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'

const store = useWorkflowStore()
const isSaving = ref(false)
const saveStatus = ref<'idle' | 'success' | 'error'>('idle')

async function saveFlow() {
  if (!store.hasTrigger) return

  isSaving.value = true
  saveStatus.value = 'idle'

  store.addLog('system', 'System', 'info', '💾 Saving workflow...')

  try {
    const payload = {
      name: 'My Workflow',
      nodes: store.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: store.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    }

    const response = await fetch('http://localhost:3001/api/workflows/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Save failed')
    }

    const result = await response.json()
    saveStatus.value = 'success'
    store.addLog('system', 'System', 'success', `✓ Workflow saved: ${result.workflow.id}`)
  } catch (error: any) {
    saveStatus.value = 'error'
    store.addLog('system', 'System', 'error', `Save failed: ${error.message}`)
  }

  setTimeout(() => {
    isSaving.value = false
    saveStatus.value = 'idle'
  }, 2000)
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <div class="logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">FlowCraft</span>
      </div>
    </div>
    <div class="topbar-center">
      <input class="workflow-name" type="text" value="My Workflow" placeholder="Workflow name" />
    </div>
    <div class="topbar-right">
      <button class="btn btn-secondary" @click="store.clearWorkflow()">
        Clear
      </button>
      <button
        class="btn btn-primary"
        :disabled="store.isExecuting || !store.hasTrigger"
        @click="store.executeWorkflow()"
      >
        {{ store.isExecuting ? '⏳ Running...' : '▶ Execute' }}
      </button>
      <button
        class="btn btn-save"
        :class="{ success: saveStatus === 'success', error: saveStatus === 'error' }"
        :disabled="isSaving || !store.hasTrigger"
        @click="saveFlow()"
      >
        <span v-if="isSaving" class="save-spinner"></span>
        {{ isSaving ? 'Saving...' : saveStatus === 'success' ? '✓ Saved' : saveStatus === 'error' ? '✕ Failed' : '💾 Save Flow' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}

.topbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.workflow-name {
  border: 1px solid transparent;
  background: transparent;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: var(--color-text);
  min-width: 200px;
  transition: all 0.2s;
}

.workflow-name:hover {
  border-color: var(--color-border);
}

.workflow-name:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.btn-save {
  background: var(--color-success);
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #059669;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save.success {
  background: #059669;
}

.btn-save.error {
  background: var(--color-danger);
}

.save-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 4px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
