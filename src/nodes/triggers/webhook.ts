import type { NodeTypeDefinition } from '@/types/workflow'

export const webhook: NodeTypeDefinition = {
  type: 'webhook',
  label: 'Webhook',
  category: 'trigger',
  icon: '🔗',
  description: 'Triggers workflow on HTTP request',
  inputs: 0,
  outputs: 1,
}
