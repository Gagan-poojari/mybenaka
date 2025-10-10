import { ShieldCheck, Clock, Percent } from 'lucide-react'

const features = [
  { icon: ShieldCheck, title: "Secure & Trusted", text: "All your financial data stays encrypted and private." },
  { icon: Clock, title: "Instant Processing", text: "Get pre-approved loan results in minutes, not days." },
  { icon: Percent, title: "Low Interest", text: "Competitive interest rates designed to suit your needs." },
]

export default function Features() {
  return (
    <section className="bg-[#f5f5f5] text-[#0d0d0d] py-24 px-6">
      <h2 className="text-center text-4xl font-bold mb-12">
        Why Choose <span className="text-[#ff6a00]">MyBenaka</span>?
      </h2>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map(({ icon: Icon, title, text }, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md hover:shadow-xl p-8 text-center transition">
            <Icon className="w-12 h-12 mx-auto text-[#ff6a00]" />
            <h3 className="text-2xl font-semibold mt-4">{title}</h3>
            <p className="mt-3 text-gray-600">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
