import Hero from './Hero';
import Problem from './Problem';
import Solution from './Solution';
import Features from './Features';
import Preview from './Preview';
import Metrics from './Metrics';
import HowItWorks from './HowItWorks';
import CTA from './CTA';
import DemoRequest from './DemoRequest';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans bg-[#F8FAFC] min-h-screen">
      {/* Simple Header */}
      <header className="absolute top-0 left-0 w-full z-50 py-6 px-6 md:px-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="4.5" stroke="white" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="font-extrabold text-[#0F172A] text-xl tracking-tight">AssetMind</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-semibold text-[#64748B]">
          <a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">How it Works</a>
        </nav>
        <button 
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 bg-[#0F172A] hover:bg-gray-800 text-white text-sm font-bold rounded-lg transition-colors"
        >
          Login
        </button>
      </header>

      <main>
        <Hero />
        <Problem />
        <Solution />
        <div id="features"><Features /></div>
        <Preview />
        <Metrics />
        <div id="how-it-works"><HowItWorks /></div>
        <CTA />
        <DemoRequest />
      </main>
      
      {/* Simple Footer */}
      <footer className="py-8 bg-[#0F172A] text-center text-sm text-[#64748B] border-t border-white/5">
        <p>&copy; 2026 AssetMind Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
