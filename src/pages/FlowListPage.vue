<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import EnginePanel from '@/components/EnginePanel.vue'

interface WorkflowSummary {
  id: string
  name: string
  nodeCount: number
  edgeCount: number
  createdAt: string
  updatedAt: string
}

const router = useRouter()
const flows = ref<WorkflowSummary[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const deletingId = ref<string | null>(null)

async function fetchFlows() {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.workflows.list()
    if (!res.ok) throw new Error('Failed to fetch workflows')
    const data = await res.json()
    flows.value = data.workflows || data
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

async function deleteFlow(id: string) {
  if (!confirm('Delete this workflow?')) return
  deletingId.value = id
  try {
    const res = await api.workflows.delete(id)
    if (!res.ok) throw new Error('Failed to delete')
    flows.value = flows.value.filter((f) => f.id !== id)
  } catch (e: any) {
    alert(`Delete failed: ${e.message}`)
  } finally {
    deletingId.value = null
  }
}

function openEditor(id?: string) {
  if (id) {
    router.push({ name: 'flow-editor', params: { id } })
  } else {
    router.push({ name: 'flow-editor-new' })
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

onMounted(fetchFlows)
</script>

<template>
  <div class="flow-list-page">
    <header class="page-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">FlowCraft</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="openEditor()">
          + New Flow
        </button>
      </div>
    </header>

    <main class="page-content">
      <div class="page-layout">
        <!-- Left: Workflows -->
        <div class="workflows-section">
          <div class="content-header">
            <h1 class="page-title">Workflows</h1>
            <button class="btn btn-secondary" @click="fetchFlows" :disabled="isLoading">
              {{ isLoading ? 'Loading...' : '↻ Refresh' }}
            </button>
          </div>

          <!-- Loading -->
          <div v-if="isLoading && flows.length === 0" class="state-block">
            <div class="spinner"></div>
            <p>Loading workflows...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="state-block error-state">
            <span class="state-icon">⚠️</span>
            <p>{{ error }}</p>
            <button class="btn btn-secondary" @click="fetchFlows">Try again</button>
          </div>

          <!-- Empty -->
          <div v-else-if="flows.length === 0" class="state-block empty-state">
            <span class="state-icon">🎯</span>
            <h3>No workflows yet</h3>
            <p>Create your first workflow to get started.</p>
            <button class="btn btn-primary" @click="openEditor()">+ New Flow</button>
          </div>

          <!-- Flow grid -->
          <div v-else class="flow-grid">
            <div
              class="flow-card"
              v-for="flow in flows"
              :key="flow.id"
              @click="openEditor(flow.id)"
            >
              <div class="card-header">
                <div class="card-icon">⚡</div>
                <div class="card-actions" @click.stop>
                  <button
                    class="icon-btn delete-btn"
                    :disabled="deletingId === flow.id"
                    @click="deleteFlow(flow.id)"
                    title="Delete"
                  >
                    {{ deletingId === flow.id ? '...' : '🗑️' }}
                  </button>
                </div>
              </div>

              <div class="card-body">
                <h3 class="card-title">{{ flow.name || 'Untitled' }}</h3>
                <p class="card-id">ID: {{ flow.id }}</p>
              </div>

              <div class="card-meta">
                <span class="meta-badge">{{ flow.nodeCount ?? '—' }} nodes</span>
                <span class="meta-badge">{{ flow.edgeCount ?? '—' }} edges</span>
              </div>

              <div class="card-footer">
                <span class="card-date" v-if="flow.updatedAt">Updated {{ formatDate(flow.updatedAt) }}</span>
                <span class="card-date" v-else-if="flow.createdAt">Created {{ formatDate(flow.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Engine panel -->
        <aside class="engines-section">
          <EnginePanel />
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.flow-list-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}

.page-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}

@media (max-width: 900px) {
  .page-layout {
    grid-template-columns: 1fr;
  }
}

.workflows-section {
  min-width: 0;
}

.engines-section {
  position: sticky;
  top: 24px;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* State blocks */
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  text-align: center;
  color: var(--color-text-muted);
}

.state-icon {
  font-size: 48px;
}

.state-block h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.state-block p {
  font-size: 14px;
}

.error-state {
  color: var(--color-danger);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Flow grid */
.flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.flow-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-icon {
  width: 36px;
  height: 36px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.card-body {
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.card-id {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: monospace;
}

.card-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 2px 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.card-footer {
  border-top: 1px solid var(--color-border);
  padding-top: 8px;
}

.card-date {
  font-size: 11px;
  color: var(--color-text-muted);
}

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
}

.delete-btn:hover {
  background: #fef2f2;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
