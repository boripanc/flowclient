import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { WorkflowNodeData, NodeTypeDefinition } from '@/types/workflow'

export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'error'

export interface LogEntry {
  id: number
  timestamp: string
  nodeId: string
  nodeLabel: string
  type: 'info' | 'success' | 'error' | 'data'
  message: string
}

export const useWorkflowStore = defineStore('workflow', () => {
  const nodes = ref<Node<WorkflowNodeData>[]>([])
  const edges = ref<Edge[]>([])
  const selectedNode = ref<Node<WorkflowNodeData> | null>(null)
  const isExecuting = ref(false)
  const logs = ref<LogEntry[]>([])
  const triggerInput = ref('')
  const nodeStatuses = ref<Record<string, NodeExecutionStatus>>({})

  let nodeIdCounter = 0
  let logIdCounter = 0

  const hasTrigger = computed(() =>
    nodes.value.some((n) => n.data.category === 'trigger')
  )

  function addLog(nodeId: string, nodeLabel: string, type: LogEntry['type'], message: string) {
    logs.value = [
      ...logs.value,
      {
        id: ++logIdCounter,
        timestamp: new Date().toLocaleTimeString(),
        nodeId,
        nodeLabel,
        type,
        message,
      },
    ]
  }

  function clearLogs() {
    logs.value = []
  }

  function addNode(nodeType: NodeTypeDefinition, position: { x: number; y: number }) {
    if (nodeType.category === 'trigger' && hasTrigger.value) {
      return null
    }

    const id = `node_${++nodeIdCounter}`
    const newNode: Node<WorkflowNodeData> = {
      id,
      type: 'workflow',
      position,
      draggable: true,
      data: {
        label: nodeType.label,
        type: nodeType.type,
        category: nodeType.category,
        icon: nodeType.icon,
        description: nodeType.description,
        config: {},
      },
    }
    nodes.value = [...nodes.value, newNode]
    return newNode
  }

  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter((n) => n.id !== nodeId)
    edges.value = edges.value.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    )
    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = null
    }
  }

  function addEdge(edge: Edge) {
    const exists = edges.value.find(
      (e) => e.source === edge.source && e.target === edge.target && e.sourceHandle === edge.sourceHandle
    )
    if (!exists) {
      edges.value = [...edges.value, edge]
    }
  }

  function removeEdge(edgeId: string) {
    edges.value = edges.value.filter((e) => e.id !== edgeId)
  }

  function selectNode(node: Node<WorkflowNodeData> | null) {
    selectedNode.value = node
  }

  function updateNodeData(nodeId: string, data: Partial<WorkflowNodeData>) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.data = { ...node.data, ...data }
    }
  }

  function clearWorkflow() {
    nodes.value = []
    edges.value = []
    selectedNode.value = null
    nodeIdCounter = 0
  }

  function getNextNodes(nodeId: string): Node<WorkflowNodeData>[] {
    const outEdges = edges.value.filter((e) => e.source === nodeId)
    return outEdges
      .map((e) => nodes.value.find((n) => n.id === e.target))
      .filter(Boolean) as Node<WorkflowNodeData>[]
  }

  function getNextNodesByHandle(nodeId: string, handleId: string): Node<WorkflowNodeData>[] {
    // Filter edges that come from this specific handle
    const outEdges = edges.value.filter((e) => {
      if (e.source !== nodeId) return false
      // Match the sourceHandle exactly
      return e.sourceHandle === handleId
    })
    return outEdges
      .map((e) => nodes.value.find((n) => n.id === e.target))
      .filter(Boolean) as Node<WorkflowNodeData>[]
  }

  function setNodeStatus(nodeId: string, status: NodeExecutionStatus) {
    nodeStatuses.value = { ...nodeStatuses.value, [nodeId]: status }
  }

  function resetNodeStatuses() {
    nodeStatuses.value = {}
  }

  async function executeWorkflow() {
    const trigger = nodes.value.find((n) => n.data.category === 'trigger')
    if (!trigger) {
      addLog('system', 'System', 'error', 'No trigger node found. Add a trigger to start the workflow.')
      return
    }

    isExecuting.value = true
    clearLogs()
    resetNodeStatuses()

    addLog('system', 'System', 'info', '▶ Workflow execution started')

    let inputData: any
    try {
      inputData = triggerInput.value.trim() ? JSON.parse(triggerInput.value) : {}
    } catch {
      inputData = { raw: triggerInput.value }
    }

    await executeNode(trigger, inputData)

    addLog('system', 'System', 'success', '✓ Workflow execution completed')
    isExecuting.value = false
  }

  async function executeNode(node: Node<WorkflowNodeData>, data: any) {
    if (!node.data) return
    setNodeStatus(node.id, 'running')
    addLog(node.id, node.data.label, 'info', 'Executing...')

    // Simulate processing time
    await new Promise((r) => setTimeout(r, 600))

    let output: any = data

    switch (node.data.type) {
      case 'webhook':
        output = { ...data, triggeredBy: 'webhook', timestamp: Date.now() }
        addLog(node.id, node.data.label, 'data', `Received: ${JSON.stringify(output)}`)
        break

      case 'schedule':
        output = { ...data, triggeredBy: 'schedule', timestamp: Date.now() }
        addLog(node.id, node.data.label, 'data', `Triggered at: ${new Date().toISOString()}`)
        break

      case 'manual':
        output = { ...data, triggeredBy: 'manual', timestamp: Date.now() }
        addLog(node.id, node.data.label, 'data', `Input: ${JSON.stringify(output)}`)
        break

      case 'http-request':
        output = { statusCode: 200, body: { message: 'OK', input: data } }
        addLog(node.id, node.data.label, 'data', `Response: ${JSON.stringify(output)}`)
        break

      case 'code':
        try {
          output = { result: data, processed: true }
          addLog(node.id, node.data.label, 'data', `Output: ${JSON.stringify(output)}`)
        } catch (e: any) {
          addLog(node.id, node.data.label, 'error', `Error: ${e.message}`)
          setNodeStatus(node.id, 'error')
          return
        }
        break

      case 'email':
        output = { sent: true, to: 'user@example.com', data }
        addLog(node.id, node.data.label, 'success', 'Email sent to user@example.com')
        break

      case 'database':
        output = { rows: [data], affected: 1 }
        addLog(node.id, node.data.label, 'data', `Query result: ${JSON.stringify(output)}`)
        break

      case 'transform':
        output = { transformed: true, data: Object.keys(data).length > 0 ? data : { empty: true } }
        addLog(node.id, node.data.label, 'data', `Transformed: ${JSON.stringify(output)}`)
        break

      case 'if-condition': {
        const conditionMet = Object.keys(data).length > 0
        const chosenHandle = conditionMet ? 'true' : 'false'
        addLog(node.id, node.data.label, 'info', `Condition: ${conditionMet ? 'TRUE → following true path' : 'FALSE → following false path'}`)
        setNodeStatus(node.id, 'completed')

        // Debug: log all edges from this node
        const allEdgesFromNode = edges.value.filter((e) => e.source === node.id)
        addLog(node.id, node.data.label, 'data', `Edges from node: ${JSON.stringify(allEdgesFromNode.map(e => ({ target: e.target, sourceHandle: e.sourceHandle })))}`)

        const ifNextNodes = getNextNodesByHandle(node.id, chosenHandle)
        if (ifNextNodes.length === 0) {
          addLog(node.id, node.data.label, 'info', `No node connected to "${chosenHandle}" output`)
        }
        for (const next of ifNextNodes) {
          await executeNode(next, data)
        }
        return
      }

      case 'switch': {
        let switchIndex = 0
        if (data && typeof data === 'object') {
          const keys = Object.keys(data)
          switchIndex = Math.min(keys.length % 3, 2)
        }
        const switchHandle = String(switchIndex)
        addLog(node.id, node.data.label, 'info', `Routing to path ${switchIndex + 1}`)
        setNodeStatus(node.id, 'completed')
        const switchNextNodes = getNextNodesByHandle(node.id, switchHandle)
        if (switchNextNodes.length === 0) {
          addLog(node.id, node.data.label, 'info', `No node connected to output ${switchIndex + 1}`)
        }
        for (const next of switchNextNodes) {
          await executeNode(next, data)
        }
        return
      }

      case 'respond':
        addLog(node.id, node.data.label, 'success', `Response: ${JSON.stringify(data)}`)
        setNodeStatus(node.id, 'completed')
        return

      case 'log':
        addLog(node.id, node.data.label, 'data', `LOG: ${JSON.stringify(data, null, 2)}`)
        setNodeStatus(node.id, 'completed')
        return

      default:
        output = data
        addLog(node.id, node.data.label, 'info', `Passed through: ${JSON.stringify(data)}`)
    }

    addLog(node.id, node.data.label, 'success', '✓ Completed')
    setNodeStatus(node.id, 'completed')

    // Execute next nodes
    const nextNodes = getNextNodes(node.id)
    for (const next of nextNodes) {
      await executeNode(next, output)
    }
  }

  return {
    nodes,
    edges,
    selectedNode,
    isExecuting,
    logs,
    triggerInput,
    hasTrigger,
    nodeStatuses,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    selectNode,
    updateNodeData,
    clearWorkflow,
    executeWorkflow,
    clearLogs,
    addLog,
  }
})
