import type { NodeTypeDefinition } from '@/types/workflow'
import { triggerNodes } from './triggers'
import { actionNodes } from './actions'
import { conditionNodes } from './conditions'
import { outputNodes } from './outputs'

export const NODE_TYPES: NodeTypeDefinition[] = [
  ...triggerNodes,
  ...actionNodes,
  ...conditionNodes,
  ...outputNodes,
]

export { triggerNodes, actionNodes, conditionNodes, outputNodes }
