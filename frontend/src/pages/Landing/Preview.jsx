import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preview = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'explorer', label: 'Asset Explorer' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'copilot', label: 'AI Copilot' },
  ];

  return (
    <section className="py-24 bg-[#0F172A] text-white overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#2563EB]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">
            Platform Preview
          </h2>
          <p className="text-lg text-[#94A3B8]">
            Experience the real industrial SaaS platform interface. No placeholders.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#2563EB] text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                  : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Browser Mockup */}
        <div className="bg-[#1E293B] rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Browser Header */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-[#0F172A]/50">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
            <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
            <div className="ml-4 flex-1">
              <div className="bg-white/5 h-6 rounded-md max-w-sm flex items-center px-3 text-xs text-white/30 font-mono">
                app.assetmind.io/{activeTab}
              </div>
            </div>
          </div>

          {/* Browser Content (Abstracted visuals matching the style) */}
          <div className="p-6 h-[500px] relative bg-[#F8FAFC]">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col gap-4"
                >
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-gray-100 mb-3"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
                      <div className="w-32 h-5 bg-gray-200 rounded mb-4"></div>
                      <div className="flex-1 bg-gradient-to-t from-[#2563EB]/10 to-transparent rounded-lg border-b-2 border-[#2563EB]"></div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-center">
                      <div className="w-40 h-40 rounded-full border-[12px] border-[#10B981] border-l-[#EF4444] border-t-[#F59E0B]"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'explorer' && (
                <motion.div
                  key="explorer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col gap-4"
                >
                  <div className="h-12 bg-white rounded-xl border border-gray-200 w-1/3 mb-2 shadow-sm"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative">
                        <div className="absolute top-4 right-4 w-6 h-6 bg-gray-100 rounded"></div>
                        <div className="w-24 h-4 bg-[#2563EB]/20 rounded mb-2"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded mb-4"></div>
                        <div className="w-16 h-6 bg-[#10B981]/20 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full grid grid-cols-2 gap-4"
                >
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
                    <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-gray-200"></div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex gap-4 mb-6 relative">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-[#2563EB] z-10"></div>
                        <div className="flex-1 h-20 bg-gray-50 border border-gray-100 rounded-lg p-3">
                          <div className="w-16 h-3 bg-gray-200 rounded mb-2"></div>
                          <div className="w-full h-2 bg-gray-100 rounded mb-1"></div>
                          <div className="w-2/3 h-2 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="h-40 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                      <div className="w-32 h-5 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between items-center bg-[#EF4444]/10 p-3 rounded-lg mb-2">
                        <div className="w-24 h-3 bg-gray-300 rounded"></div>
                        <div className="w-16 h-4 bg-[#EF4444] rounded"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'copilot' && (
                <motion.div
                  key="copilot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex gap-4"
                >
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-4">
                    <div className="flex-1 flex flex-col gap-4">
                       <div className="self-end w-2/3 h-12 bg-[#2563EB] rounded-[16px_16px_4px_16px] opacity-90"></div>
                       <div className="self-start w-3/4 h-48 bg-gray-50 border border-gray-200 rounded-[4px_16px_16px_16px] p-4">
                         <div className="w-full h-12 bg-[#EF4444]/10 rounded-lg border-l-4 border-[#EF4444] mb-4"></div>
                         <div className="w-full h-8 bg-[#3B82F6]/10 rounded-lg mb-2"></div>
                       </div>
                    </div>
                    <div className="h-12 border border-gray-200 rounded-lg bg-gray-50 flex items-center px-4">
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-64 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="w-24 h-5 bg-gray-200 rounded mb-4"></div>
                    <div className="w-full h-10 bg-gray-50 rounded-lg border border-gray-100 mb-2"></div>
                    <div className="w-full h-10 bg-gray-50 rounded-lg border border-gray-100 mb-2"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Preview;
