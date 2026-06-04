import type { NodeTypeDefinition } from '@/types/workflow'

export const schedule: NodeTypeDefinition = {
  type: 'schedule',
  label: 'Schedule',
  category: 'trigger',
  icon: '⏰',
  description: 'Triggers workflow on a schedule',
  inputs: 0,
  outputs: 1,
}
