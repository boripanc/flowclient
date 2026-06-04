import type { NodeTypeDefinition } from '@/types/workflow'

export const manual: NodeTypeDefinition = {
  type: 'manual',
  label: 'Manual Trigger',
  category: 'trigger',
  icon: '👆',
  description: 'Manually trigger the workflow',
  inputs: 0,
  outputs: 1,
}
