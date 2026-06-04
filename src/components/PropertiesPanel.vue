<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import type { NodeCategory } from '@/types/workflow'

const store = useWorkflowStore()

const node = computed(() => store.selectedNode)

function getCategoryColor(category: NodeCategory): string {
  const colors: Record<NodeCategory, string> = {
    trigger: 'var(--color-node-trigger)',
    action: 'var(--color-node-action)',
    condition: 'var(--color-node-condition)',
    output: 'var(--color-node-output)',
  }
  return colors[category]
}

function updateLabel(event: Event) {
  const target = event.target as HTMLInputElement
  if (node.value) {
    store.updateNodeData(node.value.id, { label: target.value })
  }
}

function deleteNode() {
  if (node.value) {
    store.removeNode(node.value.id)
  }
}

function closePanel() {
  store.selectNode(null)
}
</script>

<template>
  <aside class="properties-panel" v-if="node">
    <div class="panel-header">
      <div class="panel-title-row">
        <div
          class="panel-icon"
          :style="{ background: getCategoryColor(node.data.category) }"
        >
          {{ node.data.icon }}
        </div>
        <div class="panel-title">
          <h3>{{ node.data.label }}</h3>
          <span class="panel-category">{{ node.data.category }}</span>
        </div>
      </div>
      <button class="close-btn" @click="closePanel">✕</button>
    </div>

    <div class="panel-body">
      <div class="form-group">
        <label class="form-label">Node Name</label>
        <input
          type="text"
          class="form-input"
          :value="node.data.label"
          @input="updateLabel"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" :placeholder="node.data.description" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Node ID</label>
        <input type="text" class="form-input disabled" :value="node.id" disabled />
      </div>

      <div class="form-group">
        <label class="form-label">Type</label>
        <input type="text" class="form-input disabled" :value="node.data.type" disabled />
      </div>

      <div class="divider"></div>

      <div class="form-group">
        <label class="form-label">Configuration</label>
        <div class="config-placeholder">
          <span>⚙️</span>
          <p>Configure this node's specific settings based on its type.</p>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <button class="btn btn-danger" @click="deleteNode">
        🗑️ Delete Node
      </button>
    </div>
  </aside>
</template>

<style scoped>
.properties-panel {
  width: 300px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.panel-title h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.panel-category {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-input.disabled {
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.form-textarea {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: var(--color-primary);
}

.divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.config-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

.config-placeholder span {
  font-size: 24px;
}

.config-placeholder p {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.btn-danger {
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: #fef2f2;
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #fee2e2;
}
</style>
