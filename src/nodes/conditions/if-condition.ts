import type { NodeTypeDefinition } from '@/types/workflow'

export const ifCondition: NodeTypeDefinition = {
  type: 'if-condition',
  label: 'IF',
  category: 'condition',
  icon: '🔀',
  description: 'Branch based on condition',
  inputs: 1,
  outputs: 2,
}
