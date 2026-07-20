import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

// ── Lightweight in-memory GET cache ──────────────────────────────────────────
// Avoids redundant network calls when navigating back to Dashboard/Insights/
// Asset Explorer within the same session. Cache is keyed by URL.
const _cache = new Map();
const CACHE_TTL_MS = 60_000; // 60 seconds

export const cachedGet = async (url) => {
  const cached = _cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }
  const response = await api.get(url);
  _cache.set(url, { data: response.data, ts: Date.now() });
  return response.data;
};


// ── Equipment ────────────────────────────────────────────────────────────────

export const getEquipment = async () => {
  return cachedGet('/equipment/');
};

export const getEquipmentById = async (id) => {
  return cachedGet(`/equipment/${id}`);
};

export const getBriefing = async (id) => {
  return cachedGet(`/equipment/${id}/briefing`);
};

export const getEquipmentHealth = async (id) => {
  return cachedGet(`/equipment/${id}/health`);
};

export const getEquipmentIncidents = async (id) => {
  return cachedGet(`/equipment/${id}/incidents`);
};

export const getEquipmentInspections = async (id) => {
  return cachedGet(`/equipment/${id}/inspections`);
};

export const getTimeline = async (id) => {
  return cachedGet(`/equipment/${id}/timeline`);
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  return cachedGet('/dashboard/');
};

export const getHighRiskAssets = async () => {
  return cachedGet('/dashboard/high-risk-assets');
};

// ── Insights ─────────────────────────────────────────────────────────────────

export const getKnowledgeGaps = async () => {
  return cachedGet('/insights/knowledge-gaps');
};

export const getKnowledgeGapsSummary = async () => {
  return cachedGet('/insights/knowledge-gaps/summary');
};

export const getExecutiveInsights = async () => {
  return cachedGet('/insights/executive');
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
