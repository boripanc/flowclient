export type NodeCategory = 'trigger' | 'action' | 'condition' | 'output'

export interface NodeTypeDefinition {
  type: string
  label: string
  category: NodeCategory
  icon: string
  description: string
  inputs: number
  outputs: number
}

export interface WorkflowNodeData {
  label: string
  type: string
  category: NodeCategory
  icon: string
  description: string
  config: Record<string, any>
}
