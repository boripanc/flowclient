import { webhook } from './webhook'
import { schedule } from './schedule'
import { manual } from './manual'

export const triggerNodes = [webhook, schedule, manual]
