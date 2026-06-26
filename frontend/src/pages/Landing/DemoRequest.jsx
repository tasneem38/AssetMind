import { useState } from 'react';

const DemoRequest = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Add any further submission logic here if needed
  };

  return (
    <section id="demo-request" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            Request a Personalized Demo
          </h2>
          <p className="text-lg text-[#64748B]">
            See how AssetMind can transform your industrial operations. Fill out the form below and our team will get back to you shortly.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[#10B981] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Request Received!</h3>
            <p className="text-[#64748B]">
              Thank you for your interest in AssetMind. Our team will contact you at {formData.email} soon.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="mt-6 px-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#0F172A] font-semibold rounded-lg shadow-sm transition-all"
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">Work Email</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">Company Name</label>
                  <input 
                    type="text" 
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">Subject</label>
                  <select 
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white"
                  >
                    <option value="">Select a subject...</option>
                    <option value="Demo Request">General Demo Request</option>
                    <option value="Pricing">Pricing Inquiry</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">Additional Information</label>
                <textarea 
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all resize-none"
                  placeholder="Tell us about your use case or specific requirements..."
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full px-8 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all flex items-center justify-center gap-2"
              >
                Submit Request
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default DemoRequest;
