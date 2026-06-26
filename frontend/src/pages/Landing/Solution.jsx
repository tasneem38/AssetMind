import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const Solution = () => {
  const inputs = [
    "Work Orders",
    "Inspection Reports",
    "Incident Reports",
    "OEM Manuals"
  ];

  return (
    <section className="py-24 bg-[#F8FAFC] overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-16">
          One Operational Brain For Every Asset
        </h2>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-gray-200 via-[#2563EB] to-gray-200 hidden md:block"></div>

          <div className="flex flex-col items-center gap-6 relative z-10">
            {/* Inputs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {inputs.map((input, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-semibold text-sm text-[#64748B]"
                >
                  {input}
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="py-4"
            >
              <ArrowDown className="text-[#2563EB] animate-bounce" size={24} />
            </motion.div>

            {/* AssetMind Intelligence Layer */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] p-1 rounded-2xl w-full max-w-lg shadow-xl"
            >
              <div className="bg-white rounded-xl p-8 h-full">
                <div className="w-12 h-12 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-[#2563EB] to-[#06B6D4] rounded-sm shadow-inner"></div>
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">AssetMind Intelligence Layer</h3>
                <p className="text-sm text-[#64748B]">Contextualizing historical data with real-time operations</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="py-4"
            >
              <ArrowDown className="text-[#10B981] animate-bounce" size={24} />
            </motion.div>

            {/* Output */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              className="bg-[#10B981] text-white font-bold px-8 py-5 rounded-2xl shadow-lg w-full max-w-sm text-lg"
            >
              Actionable Recommendations
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
