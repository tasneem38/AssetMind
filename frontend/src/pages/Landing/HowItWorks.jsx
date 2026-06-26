const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Ingest Documents",
      description: "Upload your historical PDFs, manuals, and CMMS exports securely."
    },
    {
      number: "02",
      title: "Connect Operational Knowledge",
      description: "AssetMind extracts entities, tags assets, and builds a knowledge graph."
    },
    {
      number: "03",
      title: "Detect Risks And Patterns",
      description: "AI continuously analyzes incoming data against historical failures."
    },
    {
      number: "04",
      title: "Support Better Decisions",
      description: "Receive real-time insights exactly when and where they matter."
    }
  ];

  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-[#64748B]">
            From raw data to operational intelligence in four simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-[#2563EB]/20 to-transparent"></div>
          
          {steps.map((step, i) => (
            <div key={i} className="relative pt-12 md:pt-0">
              <div className="md:mx-auto md:mb-8 w-12 h-12 bg-white rounded-full border-4 border-[#F8FAFC] shadow-sm flex items-center justify-center text-sm font-black text-[#2563EB] absolute top-0 md:relative z-10">
                {step.number}
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2 md:text-center mt-2 md:mt-0">{step.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed md:text-center">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
