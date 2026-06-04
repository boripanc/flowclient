<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'

const store = useWorkflowStore()
const logContainer = ref<HTMLElement | null>(null)
const isCollapsed = ref(false)

watch(
  () => store.logs.length,
  async () => {
    await nextTick()
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  }
)

function handleExecute() {
  store.executeWorkflow()
}

function getLogClass(type: string) {
  return `log-${type}`
}
</script>

<template>
  <div class="execution-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-toolbar">
      <button class="toggle-btn" @click="isCollapsed = !isCollapsed">
        <span :class="{ rotated: !isCollapsed }">▲</span>
      </button>
      <span class="panel-label">Console</span>
      <div class="toolbar-actions">
        <button class="toolbar-btn" @click="store.clearLogs()" title="Clear logs">
          🗑️
        </button>
      </div>
    </div>

    <div v-show="!isCollapsed" class="panel-content">
      <div class="input-section">
        <div class="input-header">
          <span class="input-label">Trigger Input (JSON)</span>
          <button
            class="execute-btn"
            :disabled="store.isExecuting || !store.hasTrigger"
            @click="handleExecute"
          >
            <span v-if="store.isExecuting" class="spinner"></span>
            <span v-else>▶</span>
            {{ store.isExecuting ? 'Running...' : 'Execute' }}
          </button>
        </div>
        <textarea
          v-model="store.triggerInput"
          class="input-textarea"
          placeholder='{ "key": "value" }'
          rows="3"
          :disabled="store.isExecuting"
        ></textarea>
      </div>

      <div class="log-section" ref="logContainer">
        <div v-if="store.logs.length === 0" class="log-empty">
          Console output will appear here when you execute the workflow.
        </div>
        <div
          v-for="log in store.logs"
          :key="log.id"
          class="log-entry"
          :class="getLogClass(log.type)"
        >
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-node">{{ log.nodeLabel }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.execution-panel {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  max-height: 320px;
  transition: max-height 0.3s ease;
}

.execution-panel.collapsed {
  max-height: 36px;
}

.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
  min-height: 36px;
}

.toggle-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--color-bg);
}

.toggle-btn .rotated {
  display: inline-block;
  transform: rotate(180deg);
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toolbar-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--color-bg);
}

.panel-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.input-section {
  width: 280px;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.execute-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.execute-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.execute-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-textarea {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--color-text);
  background: var(--color-bg);
  resize: none;
  transition: border-color 0.2s;
}

.input-textarea:focus {
  border-color: var(--color-primary);
}

.input-textarea:disabled {
  opacity: 0.6;
}

.log-section {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  background: #1e1e2e;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.log-empty {
  color: #6c7086;
  padding: 16px;
  text-align: center;
  font-style: italic;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  align-items: flex-start;
}

.log-time {
  color: #6c7086;
  flex-shrink: 0;
  font-size: 11px;
}

.log-node {
  color: #89b4fa;
  flex-shrink: 0;
  font-weight: 500;
  min-width: 100px;
  font-size: 11px;
}

.log-message {
  color: #cdd6f4;
  word-break: break-all;
}

.log-entry.log-success .log-message {
  color: #a6e3a1;
}

.log-entry.log-error .log-message {
  color: #f38ba8;
}

.log-entry.log-data .log-message {
  color: #f9e2af;
}

.log-entry.log-info .log-message {
  color: #cdd6f4;
}
</style>
