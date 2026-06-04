import type { NodeTypeDefinition } from '@/types/workflow'

export const database: NodeTypeDefinition = {
  type: 'database',
  label: 'Database',
  category: 'action',
  icon: '🗄️',
  description: 'Query a database',
  inputs: 1,
  outputs: 1,
}
