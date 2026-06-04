<script setup lang="ts">
import { ref } from 'vue'
import { NODE_TYPES } from '@/nodes'
import type { NodeTypeDefinition, NodeCategory } from '@/types/workflow'
import { useWorkflowStore } from '@/stores/workflow'

const store = useWorkflowStore()
const searchQuery = ref('')
const activeCategory = ref<NodeCategory | 'all'>('all')

const categories: { key: NodeCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'trigger', label: 'Triggers' },
  { key: 'action', label: 'Actions' },
  { key: 'condition', label: 'Logic' },
  { key: 'output', label: 'Output' },
]

function filteredNodes() {
  return NODE_TYPES.filter((node) => {
    const matchCategory = activeCategory.value === 'all' || node.category === activeCategory.value
    const matchSearch = node.label.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchCategory && matchSearch
  })
}

function onDragStart(event: DragEvent, nodeType: NodeTypeDefinition) {
  // Prevent dragging trigger if one already exists
  if (nodeType.category === 'trigger' && store.hasTrigger) {
    event.preventDefault()
    return
  }
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(nodeType))
    event.dataTransfer.effectAllowed = 'move'
  }
}

function isNodeDisabled(nodeType: NodeTypeDefinition): boolean {
  return nodeType.category === 'trigger' && store.hasTrigger
}

function getCategoryColor(category: NodeCategory): string {
  const colors: Record<NodeCategory, string> = {
    trigger: 'var(--color-node-trigger)',
    action: 'var(--color-node-action)',
    condition: 'var(--color-node-condition)',
    output: 'var(--color-node-output)',
  }
  return colors[category]
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">Nodes</h3>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search nodes..."
          class="search-input"
        />
      </div>
    </div>

    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="category-tab"
        :class="{ active: activeCategory === cat.key }"
        @click="activeCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="node-list">
      <div
        v-for="nodeType in filteredNodes()"
        :key="nodeType.type"
        class="node-item"
        :class="{ disabled: isNodeDisabled(nodeType) }"
        :draggable="!isNodeDisabled(nodeType)"
        @dragstart="onDragStart($event, nodeType)"
      >
        <div class="node-item-icon" :style="{ background: getCategoryColor(nodeType.category) }">
          {{ nodeType.icon }}
        </div>
        <div class="node-item-info">
          <span class="node-item-label">{{ nodeType.label }}</span>
          <span class="node-item-desc">
            {{ isNodeDisabled(nodeType) ? 'Only one trigger allowed' : nodeType.description }}
          </span>
        </div>
      </div>
      <div v-if="filteredNodes().length === 0" class="empty-state">
        No nodes found
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-text);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.search-icon {
  font-size: 12px;
}

.search-input {
  border: none;
  background: transparent;
  font-size: 13px;
  width: 100%;
  color: var(--color-text);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.category-tabs {
  display: flex;
  padding: 8px 16px;
  gap: 4px;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.category-tab {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 100px;
  background: transparent;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: all 0.2s;
}

.category-tab:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.category-tab.active {
  background: var(--color-primary);
  color: white;
}

.node-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.node-item:hover {
  background: var(--color-bg);
  border-color: var(--color-border);
}

.node-item:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.node-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.node-item-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.node-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.node-item-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.node-item-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
