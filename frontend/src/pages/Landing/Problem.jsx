import { motion } from 'framer-motion';
import { Database, Users, Search, AlertTriangle } from 'lucide-react';

const problems = [
  {
    icon: <Database size={24} className="text-[#2563EB]" />,
    title: "Fragmented Systems",
    description: "Maintenance records, inspections, manuals, and incidents live in disconnected systems."
  },
  {
    icon: <Users size={24} className="text-[#F59E0B]" />,
    title: "Lost Expertise",
    description: "Critical operational knowledge disappears when experienced engineers retire."
  },
  {
    icon: <Search size={24} className="text-[#06B6D4]" />,
    title: "Delayed Decisions",
    description: "Engineers spend hours searching instead of solving."
  },
  {
    icon: <AlertTriangle size={24} className="text-[#EF4444]" />,
    title: "Preventable Failures",
    description: "Warnings exist but never reach the right person at the right time."
  }
];

const Problem = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            Industrial Knowledge Is Broken
          </h2>
          <p className="text-lg text-[#64748B]">
            Data silos and scattered documentation are costing industrial operations millions in avoidable downtime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6">
                {problem.icon}
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-3">{problem.title}</h3>
              <p className="text-[15px] text-[#64748B] leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;
