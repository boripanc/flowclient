const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001'

export const api = {
  workflows: {
    list: () => fetch(`${BASE_URL}/api/workflows`),
    get: (id: string) => fetch(`${BASE_URL}/api/workflows/${id}`),
    create: (payload: unknown) =>
      fetch(`${BASE_URL}/api/workflows/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: unknown) =>
      fetch(`${BASE_URL}/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      fetch(`${BASE_URL}/api/workflows/${id}`, { method: 'DELETE' }),
  },
}
