import { useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import { askCopilot } from '../services/api';

const EXAMPLE_QUESTIONS = [
  'Why is PMP-CW-101 failing?',
  'How to prevent bearing wear?',
  'What is the recommended maintenance interval for centrifugal pumps?',
  'What caused the last incident on CMP-AIR-201?',
  'How to diagnose seal leakage on HEX-ST-301?',
];

/**
 * Map the backend /ask/copilot response to the structured format
 * that ChatWindow already knows how to render:
 * { role, cause, evidence[], oem, confidence, risk, rul }
 */
const mapResponseToMessage = (data) => {
  // cause: first root cause or first line of answer summary
  const cause =
    data.root_causes?.length > 0
      ? data.root_causes[0]
      : extractFirstLine(data.answer, 'Summary');

  // evidence: recommended actions if available, else extract from answer
  const evidence =
    data.recommended_actions?.length > 0
      ? data.recommended_actions
      : extractSection(data.answer, 'Evidence') ||
        extractSection(data.answer, 'Likely Causes') ||
        ['See full analysis below'];

  // OEM reference: first manual citation
  const firstManual = data.sources?.manuals?.[0];
  const oem = firstManual
    ? `${firstManual.manual} — Page ${firstManual.page}`
    : 'Multiple OEM sources referenced';

  // confidence: backend returns 0–1 float, ChatWindow expects 0–100 int
  const confidence = Math.round((data.confidence ?? 0.72) * 100);

  // risk: map risk_category to lowercase for ChatWindow styling
  const risk = (data.risk_category ?? 'medium').toLowerCase();

  // rul / recommendation: tail section of answer or root causes list
  const rul =
    extractSection(data.answer, 'Recommendation') ||
    (data.root_causes?.length > 1 ? `Also consider: ${data.root_causes.slice(1).join(', ')}` : null) ||
    'Review full report for detailed recommendations';

  // Append the full markdown answer as an extra context field
  return {
    role: 'assistant',
    cause,
    evidence,
    oem,
    confidence,
    risk,
    rul,
    fullAnswer: data.answer, // stored but rendered separately
  };
};

/** Extract first sentence after a markdown heading */
const extractFirstLine = (text, heading) => {
  if (!text) return null;
  const re = new RegExp(`###\\s*${heading}[^\\n]*\\n([^\\n]+)`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : text.split('\n').find((l) => l.trim().length > 10)?.trim() ?? null;
};

/** Extract bullet lines under a markdown heading section */
const extractSection = (text, heading) => {
  if (!text) return null;
  const re = new RegExp(`###\\s*${heading}[^\\n]*\\n(.*?)(?=###|\\Z)`, 'is');
  const m = text.match(re);
  if (!m) return null;
  const lines = m[1]
    .split('\n')
    .map((l) => l.replace(/^[-*•▸\d.]+\s*/, '').trim())
    .filter((l) => l.length > 5);
  return lines.length ? lines.slice(0, 5) : null;
};

const Copilot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setBackendError(null);

    try {
      const data = await askCopilot(text);
      const assistantMsg = mapResponseToMessage(data);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Copilot error:', err);
      const errMsg = err?.response?.data?.detail ?? 'Could not reach the backend. Make sure the API server is running.';
      setBackendError(errMsg);
      // Surface the error as a system message in the chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          cause: 'Backend Unavailable',
          evidence: [errMsg, 'Check that uvicorn is running on port 8000', 'Verify ChromaDB and the ML models are loaded'],
          oem: 'N/A — backend offline',
          confidence: 0,
          risk: 'medium',
          rul: 'Restart the backend server and try again',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-4">
        <h1 className="text-[22px] font-bold text-[var(--color-text-main)] tracking-[-0.4px]">AssetMind Copilot</h1>
        <p className="text-[13.5px] text-[var(--color-text2)] mt-1">
          AI-powered maintenance intelligence — RAG over OEM manuals + live equipment history
        </p>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5 flex-1 min-h-0">
        {/* Chat area */}
        <div className="bg-white border border-[var(--color-border-main)] rounded-[12px] flex flex-col shadow-sm overflow-hidden">
          <div className="p-3.5 px-5 border-b border-[var(--color-border-main)] flex items-center gap-2.5 bg-[#F8FAFC]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-sm shadow-[0_0_16px_rgba(20,184,166,0.4)]">🤖</div>
            <div>
              <div className="text-[13px] font-bold text-[var(--color-text-main)]">AssetMind Copilot</div>
              <div className="text-[11px] text-[var(--color-text3)]">Backed by RAG · OEM manuals · Live DB</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] text-[var(--color-text3)]">Live</span>
            </div>
          </div>

          <ChatWindow messages={messages} isTyping={isTyping} />

          <div className="p-4 border-t border-[var(--color-border-main)] flex gap-2.5">
            <input
              type="text"
              className="flex-1 py-[11px] px-4 bg-[var(--color-bg)] border border-[var(--color-border-main)] rounded-[10px] text-[13.5px] outline-none focus:border-[var(--color-primary-light)] focus:bg-white transition-all shadow-sm"
              placeholder="Ask about any asset, failure mode, or maintenance procedure…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
            />
            <button
              className="btn btn-primary flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              onClick={() => handleSend()}
              disabled={isTyping}
            >
              {isTyping ? '⏳' : 'Send ↗'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold">💬 Example Questions</h2></div>
            <div className="card-body py-3.5 px-4 flex flex-col gap-1.5">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className="text-left py-[9px] px-[13px] bg-[var(--color-surface2)] border border-[var(--color-border-main)] rounded-lg text-[12.5px] text-[var(--color-text2)] hover:bg-[var(--color-primary-glow)] hover:text-[var(--color-primary)] hover:border-[rgba(15,118,110,0.3)] transition-all flex gap-1 items-start before:content-['▸'] before:text-[var(--color-primary-light)] before:text-[10px] before:mt-[2px] before:shrink-0"
                  onClick={() => !isTyping && handleSend(q)}
                  disabled={isTyping}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold">🔍 Data Sources</h2></div>
            <div className="card-body py-3.5 px-4 flex flex-col gap-2">
              {[
                { icon: '📚', label: 'OEM Manuals', sub: 'ChromaDB vector index' },
                { icon: '🔧', label: 'Work Orders', sub: 'PostgreSQL live data' },
                { icon: '📋', label: 'Inspections', sub: 'PostgreSQL live data' },
                { icon: '⚠', label: 'Incidents', sub: 'PostgreSQL live data' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="text-base">{icon}</div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-[var(--color-text-main)]">{label}</div>
                    <div className="text-[11px] text-[var(--color-text3)]">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Copilot;
