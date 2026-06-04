<script setup lang="ts">
import { watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { NodeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import WorkflowNode from './WorkflowNode.vue'
import { useWorkflowStore } from '@/stores/workflow'
import type { NodeTypeDefinition } from '@/types/workflow'

const store = useWorkflowStore()

const { project, getEdges, addEdges, onConnect } = useVueFlow()

// When a connection is made, add the edge with sourceHandle preserved
onConnect((connection) => {
  const sourceHandle = connection.sourceHandle ?? undefined
  const targetHandle = connection.targetHandle ?? undefined
  const edgeId = `e-${connection.source}-${sourceHandle || 'default'}-${connection.target}`

  addEdges([{
    id: edgeId,
    source: connection.source,
    target: connection.target,
    sourceHandle,
    targetHandle,
    animated: true,
    style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
  }])
})

// Sync Vue Flow's internal edges to our store whenever they change
watch(getEdges, (flowEdges) => {
  store.edges = flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    animated: e.animated,
    style: e.style,
  }))
}, { deep: true })

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event: DragEvent) {
  const data = event.dataTransfer?.getData('application/vueflow')
  if (!data) return

  const nodeType: NodeTypeDefinition = JSON.parse(data)

  // Prevent adding a second trigger
  if (nodeType.category === 'trigger' && store.hasTrigger) {
    store.addLog('system', 'System', 'error', 'Only one trigger node is allowed per workflow.')
    return
  }

  const position = project({
    x: event.clientX - 260,
    y: event.clientY - 56,
  })

  store.addNode(nodeType, position)
}

function onNodeClick(_event: NodeMouseEvent) {
  const node = _event.node
  store.selectNode(node as any)
}

function onPaneClick() {
  store.selectNode(null)
}
</script>

<template>
  <div class="editor-canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      v-model:nodes="store.nodes"
      :edges="store.edges"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
    >
      <template #node-workflow="nodeProps">
        <WorkflowNode :id="nodeProps.id" :data="nodeProps.data" :selected="nodeProps.selected" />
      </template>

      <Background :gap="20" :size="1" pattern-color="#e2e8f0" />
      <Controls position="bottom-right" />
      <MiniMap position="bottom-left" />
    </VueFlow>

    <div v-if="store.nodes.length === 0" class="empty-canvas">
      <div class="empty-content">
        <span class="empty-icon">🎯</span>
        <h3>Start building your workflow</h3>
        <p>Drag and drop nodes from the sidebar to get started</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-canvas {
  flex: 1;
  position: relative;
  background: var(--color-bg);
}

.empty-canvas {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.empty-content {
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}

.empty-content p {
  font-size: 14px;
}
</style>
