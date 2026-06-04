import type { NodeTypeDefinition } from '@/types/workflow'

export const log: NodeTypeDefinition = {
  type: 'log',
  label: 'Log Output',
  category: 'output',
  icon: '📝',
  description: 'Log data for debugging',
  inputs: 1,
  outputs: 0,
}
