import { useEffect, useRef } from 'react';

const ChatWindow = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
      {messages.length === 0 ? (
        <div className="text-center py-5">
          <div className="text-[28px] mb-2">🤖</div>
          <div className="text-sm font-semibold text-[var(--color-text-main)] mb-1">Ask anything about your assets</div>
          <div className="text-[12.5px] text-[var(--color-text3)]">I have access to work orders, equipment profiles, inspection records, and OEM documentation.</div>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div key={idx} className={`max-w-[80%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
            {msg.role === 'user' && <div className="text-[11px] text-[var(--color-text3)] font-semibold mb-1 text-right">You</div>}
            {msg.role === 'assistant' && <div className="text-[11px] text-[var(--color-text3)] font-semibold mb-1">AssetMind Copilot</div>}
            
            <div className={`py-3 px-4 text-[13.5px] leading-relaxed ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-[14px_14px_4px_14px]' : 'bg-[var(--color-surface2)] text-[var(--color-text-main)] border border-[var(--color-border-main)] rounded-[4px_14px_14px_14px]'}`}>
              {msg.role === 'assistant' ? (
                <div className="flex flex-col gap-3.5">
                  <div className={`py-3 px-3.5 bg-[${msg.risk === 'critical' ? 'rgba(185,28,28,0.05)' : 'rgba(239,68,68,0.05)'}] rounded-[10px] border-l-4 ${msg.risk === 'critical' ? 'border-[#B91C1C]' : 'border-[#EF4444]'}`}>
                    <div className="text-[10.5px] font-extrabold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-1">Likely Cause</div>
                    <div className={`text-[15px] font-extrabold ${msg.risk === 'critical' ? 'text-[#B91C1C]' : 'text-[#EF4444]'}`}>{msg.cause}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-extrabold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-1">Evidence</div>
                    {msg.evidence?.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className="text-[var(--color-primary-light)] mt-0.5 shrink-0">▸</span>
                        <div className="text-[12.5px] text-[var(--color-text2)]">{e}</div>
                      </div>
                    ))}
                  </div>
                  <div className="py-2.5 px-3 bg-[#3B82F6]/5 rounded-lg border border-[#3B82F6]/15">
                    <div className="text-[10.5px] font-extrabold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-1">OEM Reference</div>
                    <div className="text-[12.5px] text-[#3B82F6] font-mono">{msg.oem}</div>
                  </div>
                  <div className="py-2.5 px-3 bg-[#0F766E]/5 rounded-lg border border-[#0F766E]/15">
                    <div className="text-[10.5px] font-extrabold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-1">Recommendation / RUL</div>
                    <div className="text-[12.5px] text-[var(--color-text2)]">{msg.rul}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-extrabold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-1">Confidence Score</div>
                    <div className="text-base font-extrabold text-[var(--color-primary)]">{msg.confidence}%</div>
                    <div className="h-1.5 bg-[var(--color-border-main)] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full" style={{ width: `${msg.confidence}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))
      )}

      {isTyping && (
        <div className="self-start max-w-[80%]">
          <div className="flex items-center gap-1.5 py-2.5 px-3.5 bg-[var(--color-surface2)] border border-[var(--color-border-main)] rounded-[4px_14px_14px_14px] text-[13px] text-[var(--color-text2)]">
            🤖 Analyzing… 
            <div className="flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] animate-bounce-custom"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] animate-bounce-custom" style={{animationDelay: '0.2s'}}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] animate-bounce-custom" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
