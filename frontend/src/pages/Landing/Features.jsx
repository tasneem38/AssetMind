import { Activity, Brain, Clock, ShieldAlert } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Activity className="text-[#2563EB]" size={24} />,
      title: "Equipment Briefing Card",
      description: "Instant asset health overview. Real-time RUL (Remaining Useful Life) predictions backed by operational history.",
      color: "bg-[#2563EB]/10 border-[#2563EB]/20"
    },
    {
      icon: <Clock className="text-[#10B981]" size={24} />,
      title: "Failure Intelligence",
      description: "Discover recurring failure patterns across your fleet. Compare current degradation curves against historical baselines.",
      color: "bg-[#10B981]/10 border-[#10B981]/20"
    },
    {
      icon: <ShieldAlert className="text-[#F59E0B]" size={24} />,
      title: "Knowledge Gap Detection",
      description: "Automatically identify ignored recommendations before they become catastrophic incidents. Track 'no action taken' gaps.",
      color: "bg-[#F59E0B]/10 border-[#F59E0B]/20"
    },
    {
      icon: <Brain className="text-[#06B6D4]" size={24} />,
      title: "AI Copilot",
      description: "Ask operational questions and receive cited answers grounded purely in your organization's manuals and history.",
      color: "bg-[#06B6D4]/10 border-[#06B6D4]/20"
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            Industrial Intelligence Features
          </h2>
          <p className="text-lg text-[#64748B]">
            Premium capabilities designed specifically for maintenance reliability and operational excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group relative bg-[#F8FAFC] border border-gray-100 rounded-3xl p-8 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all overflow-hidden z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-transparent opacity-50 pointer-events-none"></div>
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm mb-6 ${feature.color}`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">{feature.title}</h3>
              <p className="text-[#64748B] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
