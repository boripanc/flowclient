import type { NodeTypeDefinition } from '@/types/workflow'

export const respond: NodeTypeDefinition = {
  type: 'respond',
  label: 'Respond',
  category: 'output',
  icon: '📤',
  description: 'Send response back',
  inputs: 1,
  outputs: 0,
}
