import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#F8FAFC]">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#2563EB]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-[#06B6D4]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
            </span>
            <span className="text-xs font-semibold text-[#0F172A]">AssetMind Intelligence 2.0 is live</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold text-[#0F172A] leading-[1.1] tracking-tight mb-6">
            Prevent Equipment Failures <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#06B6D4]">Before They Happen</span>
          </h1>
          
          <p className="text-lg text-[#64748B] mb-10 leading-relaxed max-w-xl">
            AssetMind transforms maintenance records, inspections, incidents, manuals, and operational knowledge into real-time decision intelligence for industrial teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => document.getElementById('demo-request')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all flex items-center justify-center gap-2"
            >
              Request Demo
              <ArrowRight size={18} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-[#0F172A] border border-gray-200 font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
              <Play size={18} className="text-[#64748B]" />
              View Platform
            </button>
          </div>
          
          <div className="mt-10 flex items-center gap-6 text-sm font-medium text-[#64748B]">
            <div className="flex items-center gap-2">
              <div className="text-[#10B981]">✓</div> No complex IT setup
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[#10B981]">✓</div> SOC2 Compliant
            </div>
          </div>
        </motion.div>

        {/* Right Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-2xl p-6 relative z-10">
            {/* Mockup Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <div>
                <div className="text-xs font-mono font-bold text-[#2563EB] bg-[#2563EB]/10 px-2 py-1 rounded inline-block mb-1">PMP-CW-101</div>
                <div className="font-bold text-[#0F172A]">Cooling Water Pump</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-full border border-[#EF4444]/20 text-xs font-bold uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
                High Risk
              </div>
            </div>

            {/* Mockup KPI Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#F8FAFC] rounded-xl p-4 border border-gray-100">
                <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Health Score</div>
                <div className="text-3xl font-black text-[#F59E0B] tracking-tight">61%</div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#F59E0B] w-[61%] rounded-full"></div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl p-4 border border-gray-100">
                <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Failure Risk</div>
                <div className="text-3xl font-black text-[#EF4444] tracking-tight">73%</div>
                <div className="text-xs text-[#64748B] mt-2 font-medium">Predicted: Next 30 Days</div>
              </div>
            </div>

            {/* Mockup Alert */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#EF4444]"></div>
              <div className="p-4 pl-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-[#EF4444]">⚠</div>
                  <div className="font-bold text-[#0F172A] text-sm">Bearing Wear Detected</div>
                </div>
                <div className="text-xs text-[#64748B] mb-3">Vibration anomaly correlated with IR-021.</div>
                <div className="bg-[#10B981]/10 text-[#0F172A] border border-[#10B981]/20 rounded-lg p-3 text-xs font-medium">
                  <span className="font-bold text-[#10B981]">AI Recommendation:</span> Replace Bearing Within 14 Days
                </div>
              </div>
            </div>
            
            {/* Small decorative chart in bg */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white rounded-xl border border-gray-100 shadow-xl p-4 flex flex-col justify-end gap-1 opacity-90 backdrop-blur-md z-20">
               <div className="w-full h-[40%] bg-[#2563EB]/20 rounded-t-sm"></div>
               <div className="w-full h-[60%] bg-[#2563EB]/40 rounded-t-sm"></div>
               <div className="w-full h-[30%] bg-[#2563EB]/60 rounded-t-sm"></div>
               <div className="w-full h-[80%] bg-[#EF4444] rounded-t-sm relative">
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full border-2 border-[#EF4444] shadow-sm"></div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
