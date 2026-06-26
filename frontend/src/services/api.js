import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// ── Equipment ────────────────────────────────────────────────────────────────

export const getEquipment = async () => {
  const response = await api.get('/equipment/');
  return response.data;
};

export const getEquipmentById = async (id) => {
  const response = await api.get(`/equipment/${id}`);
  return response.data;
};

export const getBriefing = async (id) => {
  const response = await api.get(`/equipment/${id}/briefing`);
  return response.data;
};

export const getEquipmentHealth = async (id) => {
  const response = await api.get(`/equipment/${id}/health`);
  return response.data;
};

export const getEquipmentIncidents = async (id) => {
  const response = await api.get(`/equipment/${id}/incidents`);
  return response.data;
};

export const getEquipmentInspections = async (id) => {
  const response = await api.get(`/equipment/${id}/inspections`);
  return response.data;
};

export const getTimeline = async (id) => {
  const response = await api.get(`/equipment/${id}/timeline`);
  return response.data;
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/');
  return response.data;
};

export const getHighRiskAssets = async () => {
  const response = await api.get('/dashboard/high-risk-assets');
  return response.data;
};

// ── Insights ─────────────────────────────────────────────────────────────────

export const getKnowledgeGaps = async () => {
  const response = await api.get('/insights/knowledge-gaps');
  return response.data;
};

export const getKnowledgeGapsSummary = async () => {
  const response = await api.get('/insights/knowledge-gaps/summary');
  return response.data;
};

export const getExecutiveInsights = async () => {
  const response = await api.get('/insights/executive');
  return response.data;
};

// ── RAG / Copilot ─────────────────────────────────────────────────────────────

export const askCopilot = async (question, context = null) => {
  const response = await api.post('/ask/copilot', { question, context });
  return response.data;
};

// ── ML Predictions ────────────────────────────────────────────────────────────

export const predictFailure = async (payload) => {
  const response = await api.post('/predict/failure', payload);
  return response.data;
};

export const predictRUL = async (payload) => {
  const response = await api.post('/predict/rul', payload);
  return response.data;
};

export default api;
