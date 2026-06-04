import type { NodeTypeDefinition } from '@/types/workflow'

export const httpRequest: NodeTypeDefinition = {
  type: 'http-request',
  label: 'HTTP Request',
  category: 'action',
  icon: '🌐',
  description: 'Make an HTTP request',
  inputs: 1,
  outputs: 1,
}
