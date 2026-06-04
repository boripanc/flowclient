import type { NodeTypeDefinition } from '@/types/workflow'

export const code: NodeTypeDefinition = {
  type: 'code',
  label: 'Code',
  category: 'action',
  icon: '💻',
  description: 'Run custom JavaScript code',
  inputs: 1,
  outputs: 1,
}
