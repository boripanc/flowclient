import type { NodeTypeDefinition } from '@/types/workflow'

export const email: NodeTypeDefinition = {
  type: 'email',
  label: 'Send Email',
  category: 'action',
  icon: '📧',
  description: 'Send an email message',
  inputs: 1,
  outputs: 1,
}
