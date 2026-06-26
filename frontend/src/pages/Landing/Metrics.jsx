const Metrics = () => {
  const stats = [
    { value: "35%", label: "Less Time Searching" },
    { value: "22%", label: "Reduction In Downtime Risk" },
    { value: "100%", label: "Knowledge Traceability" },
    { value: "24/7", label: "Operational Intelligence" }
  ];

  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-gray-100">
          {stats.map((stat, index) => (
            <div key={index} className="text-center px-4">
              <div className="text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tighter mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-[#64748B] uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Metrics;
