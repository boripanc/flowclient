<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import type { NodeCategory } from '@/types/workflow'

const store = useWorkflowStore()

const node = computed(() => store.selectedNode)

const switchCases = computed(() => {
  if (node.value?.data?.type === 'switch') {
    return node.value.data.config?.cases || 3
  }
  return 0
})

const switchCaseLabels = computed(() => {
  if (node.value?.data?.type === 'switch') {
    return node.value.data.config?.caseLabels || []
  }
  return []
})

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

function addSwitchCase() {
  if (node.value && switchCases.value < 10) {
    const labels = [...switchCaseLabels.value]
    labels.push('')
    store.updateNodeData(node.value.id, {
      config: { ...node.value.data.config, cases: switchCases.value + 1, caseLabels: labels }
    })
  }
}

function removeSwitchCase() {
  if (node.value && switchCases.value > 2) {
    const handleId = String(switchCases.value - 1)
    store.removeEdgesByHandle(node.value.id, handleId)
    const labels = [...switchCaseLabels.value]
    labels.pop()
    store.updateNodeData(node.value.id, {
      config: { ...node.value.data.config, cases: switchCases.value - 1, caseLabels: labels }
    })
  }
}

function updateCaseLabel(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  if (node.value) {
    const labels = [...switchCaseLabels.value]
    // Ensure array is long enough
    while (labels.length < switchCases.value) {
      labels.push('')
    }
    labels[index] = target.value
    store.updateNodeData(node.value.id, {
      config: { ...node.value.data.config, caseLabels: labels }
    })
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
  <aside class="properties-panel" v-if="node && node.data">
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

      <!-- Switch case configuration -->
      <div class="form-group" v-if="node.data.type === 'switch'">
        <label class="form-label">Output Cases</label>
        <div class="switch-config">
          <div class="switch-cases-header">
            <span class="cases-count">{{ switchCases }} cases</span>
            <div class="cases-actions">
              <button class="btn-icon" @click="removeSwitchCase" :disabled="switchCases <= 2" title="Remove case">−</button>
              <button class="btn-icon" @click="addSwitchCase" :disabled="switchCases >= 10" title="Add case">+</button>
            </div>
          </div>
          <div class="switch-cases-list">
            <div class="switch-case-item" v-for="i in switchCases" :key="i">
              <span class="case-dot"></span>
              <span class="case-index">{{ i }}</span>
              <input
                type="text"
                class="case-input"
                :value="switchCaseLabels[i - 1] || ''"
                :placeholder="`Condition for case ${i}`"
                @input="updateCaseLabel(i - 1, $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Generic config for non-switch nodes -->
      <div class="form-group" v-else>
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

.switch-config {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 12px;
}

.switch-cases-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.cases-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.cases-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.switch-cases-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.switch-case-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.case-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-node-condition);
  flex-shrink: 0;
}

.case-index {
  font-weight: 600;
  font-size: 11px;
  color: var(--color-text-muted);
  width: 16px;
  flex-shrink: 0;
  text-align: center;
}

.case-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s;
  min-width: 0;
}

.case-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.case-input::placeholder {
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
