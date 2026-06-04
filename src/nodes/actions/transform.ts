import type { NodeTypeDefinition } from '@/types/workflow'

export const transform: NodeTypeDefinition = {
  type: 'transform',
  label: 'Transform',
  category: 'action',
  icon: '🔄',
  description: 'Transform data between nodes',
  inputs: 1,
  outputs: 1,
}
