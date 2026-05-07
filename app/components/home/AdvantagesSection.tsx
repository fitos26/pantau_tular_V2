const features = [
  {
    id: "akses-mudah",
    icon: "⚡",
    iconBg: "bg-blue-50",
    title: "Akses Mudah & Cepat",
    text: "Informasi sebaran penyakit tersedia untuk semua kalangan dari masyarakat umum hingga tenaga kesehatan profesional.",
    tag: "Kemudahan akses",
  },
  {
    id: "data-akurat",
    icon: "✓",
    iconBg: "bg-emerald-50",
    title: "Data Akurat & Terkini",
    text: "Data aktual yang dapat diandalkan untuk pengambilan keputusan pencegahan penyakit menular secara tepat dan cepat.",
    tag: "Berbasis data",
  },
  {
    id: "pemantauan-efektif",
    icon: "◎",
    iconBg: "bg-amber-50",
    title: "Pemantauan Efektif",
    text: "Peta interaktif dan fitur lengkap untuk memahami kondisi kesehatan wilayah Indonesia secara mendalam.",
    tag: "Peta interaktif",
  },
];

export default function AdvantagesSection() {
  return (
    <section className="w-full py-10 px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
          >
            <div className={`w-10 h-10 ${feature.iconBg} rounded-xl flex items-center justify-center text-lg`}>
              {feature.icon}
            </div>

            <h3 className="text-base font-semibold text-blue-950">
              {feature.title}
            </h3>

            <p className="text-sm text-slate-500 leading-relaxed">
              {feature.text}
            </p>

            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full self-start">
              {feature.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
