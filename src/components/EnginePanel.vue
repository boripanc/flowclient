<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { api, BASE_URL } from '@/api'

interface Engine {
  id: string
  name: string
  hostname?: string
  status: 'connected' | 'disconnected' | 'unknown'
  connectedAt?: string
  lastSeen?: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

type WsMessage =
  | { type: 'engine_list'; engines: Engine[] }
  | { type: 'engine_connected'; engine: Engine }
  | { type: 'engine_disconnected'; engine: Engine }
  | { type: 'engine_heartbeat'; engine: Engine }

// --- State ---
const engines = ref<Engine[]>([])
const isLoading = ref(false)
const isAdding = ref(false)
const deletingId = ref<string | null>(null)
const copiedId = ref<string | null>(null)
const error = ref<string | null>(null)
const toasts = ref<Toast[]>([])
let toastCounter = 0

// Dialog state
const showDialog = ref(false)
const dialogName = ref('')
const dialogHostname = ref('')
const dialogError = ref<string | null>(null)

// WebSocket state
let socket: WebSocket | null = null
const wsConnected = ref(false)

// --- Toast ---
function addToast(message: string, type: Toast['type'] = 'info') {
  const id = ++toastCounter
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter((t) => t.id !== id) }, 4000)
}

function dismissToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

// --- Dialog ---
function openDialog() {
  dialogName.value = ''
  dialogHostname.value = ''
  dialogError.value = null
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

// --- WebSocket message handler ---
function applyEngineUpdate(updated: Engine) {
  const existing = engines.value.find((e) => e.id === updated.id)
  if (existing) {
    existing.status = updated.status
    existing.lastSeen = updated.lastSeen
    existing.connectedAt = updated.connectedAt
  }
}

function handleMessage(msg: WsMessage) {
  switch (msg.type) {
    case 'engine_list':
      // Bulk-update statuses from server snapshot
      msg.engines.forEach((serverEngine) => {
        const local = engines.value.find((e) => e.id === serverEngine.id)
        if (local) {
          local.status = serverEngine.status
          local.lastSeen = serverEngine.lastSeen
          local.connectedAt = serverEngine.connectedAt
        }
      })
      break

    case 'engine_connected':
      applyEngineUpdate(msg.engine)
      addToast(`⚡ ${msg.engine.name} connected`, 'success')
      break

    case 'engine_disconnected':
      applyEngineUpdate(msg.engine)
      addToast(`🔌 ${msg.engine.name} disconnected`, 'error')
      break

    case 'engine_heartbeat':
      applyEngineUpdate(msg.engine)
      break
  }
}

// --- WebSocket ---
function connectSocket() {
  const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws/client'
  try {
    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      wsConnected.value = true
    }

    socket.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data) as WsMessage)
      } catch { /* ignore */ }
    }

    socket.onclose = () => {
      wsConnected.value = false
      engines.value.forEach((e) => { e.status = 'unknown' })
      setTimeout(connectSocket, 5000)
    }

    socket.onerror = () => {
      wsConnected.value = false
    }
  } catch { /* WebSocket unavailable */ }
}

// --- API calls ---
async function fetchEngines() {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.engines.list()
    if (!res.ok) throw new Error('Failed to fetch engines')
    const data = await res.json()
    const list: Engine[] = data.engines || data
    // Start all as unknown — WebSocket will push real statuses
    engines.value = list.map((e) => ({ ...e, status: 'unknown' as const }))
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

async function submitAddEngine() {
  if (!dialogHostname.value.trim()) {
    dialogError.value = 'Hostname is required.'
    return
  }
  isAdding.value = true
  dialogError.value = null
  try {
    const res = await api.engines.create({
      name: dialogName.value.trim() || 'New Engine',
      hostname: dialogHostname.value.trim(),
    })
    if (!res.ok) throw new Error('Failed to create engine')
    const data = await res.json()
    const engine: Engine = data.engine || data
    engines.value.push({ ...engine, status: 'unknown' })
    closeDialog()
  } catch (e: any) {
    dialogError.value = e.message
  } finally {
    isAdding.value = false
  }
}

async function deleteEngine(id: string) {
  if (!confirm('Remove this engine? The engine will lose its connection token.')) return
  deletingId.value = id
  try {
    const res = await api.engines.delete(id)
    if (!res.ok) throw new Error('Failed to delete')
    engines.value = engines.value.filter((e) => e.id !== id)
  } catch (e: any) {
    alert(`Delete failed: ${e.message}`)
  } finally {
    deletingId.value = null
  }
}

async function copyToken(id: string) {
  await navigator.clipboard.writeText(id)
  copiedId.value = id
  setTimeout(() => { copiedId.value = null }, 2000)
}

function statusColor(status: Engine['status']) {
  return status === 'connected' ? '#10b981' : status === 'disconnected' ? '#ef4444' : '#94a3b8'
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

onMounted(async () => {
  await fetchEngines()
  connectSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.onclose = null
    socket.close()
  }
})
</script>

<template>
  <section class="engine-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="panel-title-row">
        <span class="panel-icon">⚙️</span>
        <h2 class="panel-title">Workflow Engines</h2>
        <span class="engine-count">{{ engines.length }}</span>
        <span
          class="ws-indicator"
          :class="wsConnected ? 'ws-on' : 'ws-off'"
          :title="wsConnected ? 'Live updates active' : 'Connecting...'"
        >
          <span class="ws-dot"></span>
          {{ wsConnected ? 'Live' : 'Connecting' }}
        </span>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary icon-only" @click="fetchEngines" :disabled="isLoading" title="Refresh">
          <span :class="{ spinning: isLoading }">↻</span>
        </button>
        <button class="btn btn-primary" @click="openDialog">+ Add Engine</button>
      </div>
    </div>

    <p v-if="error" class="error-msg">⚠️ {{ error }}</p>

    <!-- Empty state -->
    <div v-if="!isLoading && engines.length === 0 && !error" class="empty-engines">
      <p>No engines registered yet.</p>
      <p class="hint">Add an engine to get its connection token, then configure your worker with it.</p>
    </div>

    <!-- Engine list -->
    <div class="engine-list">
      <div class="engine-row" v-for="engine in engines" :key="engine.id">
        <div
          class="engine-status-dot"
          :class="{ 'dot-pulse': engine.status === 'connected' }"
          :style="{ background: statusColor(engine.status) }"
        ></div>

        <div class="engine-info">
          <div class="engine-name-row">
            <span class="engine-name">{{ engine.name || 'Unnamed Engine' }}</span>
            <span class="engine-hostname" v-if="engine.hostname">{{ engine.hostname }}</span>
          </div>
          <div class="engine-token">
            <span class="token-label">Token:</span>
            <span class="token-text">{{ engine.id }}</span>
            <button
              class="copy-btn"
              @click="copyToken(engine.id)"
              :title="copiedId === engine.id ? 'Copied!' : 'Copy token'"
            >{{ copiedId === engine.id ? '✓' : '⧉' }}</button>
          </div>
          <div class="engine-meta">
            <span class="status-badge" :class="engine.status">{{ engine.status }}</span>
            <span v-if="engine.lastSeen" class="last-seen">Last seen: {{ formatDate(engine.lastSeen) }}</span>
          </div>
        </div>

        <button
          class="icon-btn delete-btn"
          :disabled="deletingId === engine.id"
          @click="deleteEngine(engine.id)"
          title="Remove engine"
        >{{ deletingId === engine.id ? '...' : '🗑️' }}</button>
      </div>
    </div>
  </section>

  <!-- Add Engine Dialog -->
  <Teleport to="body">
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="dialog-header">
          <h3 id="dialog-title" class="dialog-title">Add Workflow Engine</h3>
          <button class="dialog-close" @click="closeDialog" aria-label="Close">✕</button>
        </div>
        <div class="dialog-body">
          <p class="dialog-desc">
            A UUID token will be generated for this engine. Configure your worker with this token to connect via socket.
          </p>
          <div class="field">
            <label class="field-label">Engine Name</label>
            <input class="field-input" type="text" v-model="dialogName" placeholder="e.g. Production Worker 1" @keydown.enter="submitAddEngine" />
          </div>
          <div class="field">
            <label class="field-label">Hostname <span class="required">*</span></label>
            <input class="field-input" type="text" v-model="dialogHostname" placeholder="e.g. engine-1.internal or 192.168.1.10" @keydown.enter="submitAddEngine" />
            <span class="field-hint">The hostname or IP where this engine runs.</span>
          </div>
          <p v-if="dialogError" class="dialog-error">⚠️ {{ dialogError }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
          <button class="btn btn-primary" @click="submitAddEngine" :disabled="isAdding">
            <span v-if="isAdding" class="btn-spinner"></span>
            {{ isAdding ? 'Adding...' : 'Add Engine' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast notifications -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
          @click="dismissToast(toast.id)"
        >
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.engine-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.panel-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.panel-icon { font-size: 18px; }

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.engine-count {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 600;
}

.ws-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.ws-on { background: #d1fae5; color: #065f46; }
.ws-off { background: var(--color-bg); color: var(--color-text-muted); border: 1px solid var(--color-border); }
.ws-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ws-on .ws-dot { animation: pulse-dot 1.5s ease-in-out infinite; }

@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.header-actions { display: flex; gap: 6px; align-items: center; }

.btn {
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary { background: var(--color-primary); color: white; white-space: nowrap; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--color-bg); color: var(--color-text-muted); border: 1px solid var(--color-border); }
.btn-secondary:hover:not(:disabled) { background: var(--color-border); color: var(--color-text); }
.icon-only { padding: 6px 10px; font-size: 16px; }
.spinning { display: inline-block; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-msg { font-size: 12px; color: var(--color-danger); }

.empty-engines {
  text-align: center;
  padding: 24px 12px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
}
.hint { margin-top: 6px; font-size: 12px; opacity: 0.7; }

.engine-list { display: flex; flex-direction: column; gap: 8px; }

.engine-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: border-color 0.3s;
}

.engine-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  transition: background 0.3s;
}

.dot-pulse {
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  animation: dot-ping 2s ease-out infinite;
}

@keyframes dot-ping {
  0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70%  { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.engine-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.engine-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.engine-name { font-size: 13px; font-weight: 600; color: var(--color-text); }

.engine-hostname {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: monospace;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.engine-token { display: flex; align-items: center; gap: 5px; }

.token-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.token-text {
  font-size: 11px;
  font-family: monospace;
  color: var(--color-text-muted);
  word-break: break-all;
}

.copy-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-primary);
  padding: 0 2px;
  transition: color 0.2s;
}
.copy-btn:hover { color: var(--color-primary-hover); }

.engine-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-badge.connected { background: #d1fae5; color: #065f46; }
.status-badge.disconnected { background: #fee2e2; color: #991b1b; }
.status-badge.unknown { background: var(--color-bg); color: var(--color-text-muted); border: 1px solid var(--color-border); }

.last-seen { font-size: 11px; color: var(--color-text-muted); }

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
  flex-shrink: 0;
}
.delete-btn:hover { background: #fef2f2; }
.delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(2px);
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  animation: dialog-in 0.15s ease;
}

@keyframes dialog-in {
  from { opacity: 0; transform: scale(0.96) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }

.dialog-close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.dialog-close:hover { background: var(--color-bg); color: var(--color-text); }

.dialog-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }

.dialog-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
  background: var(--color-bg);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
}

.field { display: flex; flex-direction: column; gap: 5px; }

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.required { color: var(--color-danger); }

.field-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s;
}
.field-input:focus { border-color: var(--color-primary); outline: none; }

.field-hint { font-size: 11px; color: var(--color-text-muted); }
.dialog-error { font-size: 12px; color: var(--color-danger); }

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

/* Toast */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  pointer-events: all;
  cursor: pointer;
  min-width: 240px;
  max-width: 360px;
}

.toast.success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.toast.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.toast.info    { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }

.toast-msg { flex: 1; }

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.5;
  padding: 0;
  color: inherit;
}
.toast-close:hover { opacity: 1; }

/* Toast transitions */
.toast-enter-active { animation: toast-in 0.25s ease; }
.toast-leave-active { animation: toast-out 0.2s ease forwards; }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes toast-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(24px); }
}
</style>
