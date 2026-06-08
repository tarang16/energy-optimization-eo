import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

export const getTopology = () => api.get('/topology').then((r) => r.data)
export const resetNetwork = () => api.post('/reset').then((r) => r.data)
export const loadDemoRefinery = () => api.post('/demo/refinery').then((r) => r.data)
export const solveNetwork = () => api.post('/solve').then((r) => r.data)

export const createComponent = (payload) =>
  api.post('/components', payload).then((r) => r.data)
export const updateComponent = (id, payload) =>
  api.patch(`/components/${id}`, payload).then((r) => r.data)
export const deleteComponent = (id) =>
  api.delete(`/components/${id}`).then((r) => r.data)
export const updateOperating = (id, payload) =>
  api.patch(`/components/${id}/operating`, payload).then((r) => r.data)

export const createConnection = (payload) =>
  api.post('/connections', payload).then((r) => r.data)
export const deleteConnection = (from_id, to_id, key) =>
  api
    .delete('/connections', { params: { from_id, to_id, key } })
    .then((r) => r.data)

export const importTopology = (payload) =>
  api.post('/import', payload).then((r) => r.data)

export const reportStatus = () => api.get('/reports/status').then((r) => r.data)
export const reportExcelUrl = () => '/api/v1/reports/excel'
export const reportWordUrl = () => '/api/v1/reports/word'

export const bulkUploadCsv = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/bulk/upload-csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export default api
