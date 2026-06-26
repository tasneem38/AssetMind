import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 bg-[#0F172A] pointer-events-none transform -skew-y-3 origin-bottom-left scale-110"></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center text-white py-12">
        <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-6">
          Stop Searching. Start Knowing.
        </h2>
        <p className="text-xl text-[#94A3B8] mb-10 max-w-2xl mx-auto font-medium">
          Turn years of maintenance history and operational knowledge into actionable intelligence.
        </p>
        
        <button 
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)]"
        >
          Explore AssetMind
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default CTA;
