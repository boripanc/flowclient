import type { NodeTypeDefinition } from '@/types/workflow'

export const switchNode: NodeTypeDefinition = {
  type: 'switch',
  label: 'Switch',
  category: 'condition',
  icon: '🔃',
  description: 'Route to different paths',
  inputs: 1,
  outputs: 3,
}
