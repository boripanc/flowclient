<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeCategory } from '@/types/workflow'
import { useWorkflowStore, type NodeExecutionStatus } from '@/stores/workflow'

const props = defineProps<{
  id: string
  data: {
    label: string
    type: string
    category: NodeCategory
    icon: string
    description: string
    config: Record<string, any>
  }
  selected: boolean
}>()

const store = useWorkflowStore()

const executionStatus = computed<NodeExecutionStatus>(() => {
  return store.nodeStatuses[props.id] || 'idle'
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

const hasSources = props.data.category !== 'trigger'
const hasTargets = props.data.category !== 'output'

const switchCases = computed(() => {
  if (props.data.type === 'switch') {
    return props.data.config?.cases || 3
  }
  return 0
})
</script>

<template>
  <div class="workflow-node" :class="[`status-${executionStatus}`, { selected }]">
    <Handle v-if="hasSources" type="target" :position="Position.Left" class="handle" />

    <!-- Status indicator -->
    <div class="status-badge" v-if="executionStatus !== 'idle'">
      <span v-if="executionStatus === 'running'" class="status-spinner"></span>
      <span v-else-if="executionStatus === 'completed'" class="status-icon completed">✓</span>
      <span v-else-if="executionStatus === 'error'" class="status-icon error">✕</span>
    </div>

    <div class="node-header" :style="{ borderColor: getCategoryColor(data.category) }">
      <div class="node-icon" :style="{ background: getCategoryColor(data.category) }">
        {{ data.icon }}
      </div>
      <div class="node-info">
        <span class="node-label">{{ data.label }}</span>
        <span class="node-type">{{ data.category }}</span>
      </div>
    </div>

    <!-- Progress bar for running state -->
    <div v-if="executionStatus === 'running'" class="progress-bar">
      <div class="progress-bar-fill"></div>
    </div>

    <!-- Standard source handle (non-condition nodes) -->
    <Handle
      v-if="hasTargets && data.category !== 'condition'"
      type="source"
      :position="Position.Right"
      class="handle"
    />

    <!-- IF condition: true/false handles -->
    <template v-if="data.type === 'if-condition'">
      <Handle
        type="source"
        :position="Position.Right"
        id="true"
        class="handle handle-true"
        :style="{ top: '35%' }"
      />
      <span class="handle-label handle-label-true">T</span>
      <Handle
        type="source"
        :position="Position.Right"
        id="false"
        class="handle handle-false"
        :style="{ top: '65%' }"
      />
      <span class="handle-label handle-label-false">F</span>
    </template>

    <!-- Switch: dynamic numbered handles -->
    <template v-if="data.type === 'switch'">
      <template v-for="i in switchCases" :key="i">
        <Handle
          type="source"
          :position="Position.Right"
          :id="String(i - 1)"
          class="handle handle-switch"
          :style="{ top: `${(i / (switchCases + 1)) * 100}%` }"
        />
        <span
          class="handle-label handle-label-switch"
          :style="{ top: `calc(${(i / (switchCases + 1)) * 100}% - 7px)` }"
        >{{ i }}</span>
      </template>
    </template>
  </div>
</template>

<style scoped>
.workflow-node {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  min-width: 180px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: visible;
}

.workflow-node:hover {
  box-shadow: var(--shadow-md);
}

.workflow-node.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Execution status styles */
.workflow-node.status-running {
  border-color: #6366f1;
  animation: pulse 1.5s ease-in-out infinite;
}

.workflow-node.status-completed {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.workflow-node.status-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), 0 0 20px rgba(99, 102, 241, 0.15); }
  50% { box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.3), 0 0 25px rgba(99, 102, 241, 0.2); }
}

/* Status badge */
.status-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.status-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-icon {
  font-size: 11px;
  font-weight: 700;
}

.status-icon.completed {
  color: #10b981;
}

.status-icon.error {
  color: #ef4444;
}

/* Progress bar */
.progress-bar {
  height: 3px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  animation: progress 0.8s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0%; margin-left: 0; }
  50% { width: 60%; margin-left: 20%; }
  100% { width: 0%; margin-left: 100%; }
}

.node-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-left: 3px solid;
  border-radius: var(--radius-lg);
}

.node-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.node-type {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.handle {
  width: 12px;
  height: 12px;
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  transition: background 0.2s;
}

.handle:hover {
  background: var(--color-primary);
}

.handle-true {
  border-color: var(--color-success);
}

.handle-true:hover {
  background: var(--color-success);
}

.handle-false {
  border-color: var(--color-danger);
}

.handle-false:hover {
  background: var(--color-danger);
}

.handle-switch {
  border-color: var(--color-node-condition);
}

.handle-switch:hover {
  background: var(--color-node-condition);
}

.handle-label {
  position: absolute;
  right: 18px;
  font-size: 9px;
  font-weight: 700;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  pointer-events: none;
}

.handle-label-true {
  top: calc(35% - 7px);
  color: var(--color-success);
}

.handle-label-false {
  top: calc(65% - 7px);
  color: var(--color-danger);
}

.handle-label-switch {
  color: var(--color-node-condition);
}
</style>
