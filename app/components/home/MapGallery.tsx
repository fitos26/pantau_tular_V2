import Image from "next/image";
import Link from "next/link";

const maps = [
  {
    src: "/peta_persebaran.png",
    alt: "Peta Sebaran Titik",
    badge: "Sebaran Titik",
    title: "Peta Sebaran Titik",
    desc: "Lihat lokasi setiap kasus penyakit secara spesifik. Klik titik untuk melihat detail kasus dan berita terkait di wilayah tersebut.",
    tag: "Lokasi spesifik",
  },
  {
    src: "/peta_tematik.png",
    alt: "Peta Heatmap Wilayah",
    badge: "Heatmap Wilayah",
    title: "Heatmap per Wilayah",
    desc: "Bandingkan intensitas kasus antar provinsi dan kabupaten dengan warna yang menunjukkan tingkat keparahan penyebaran.",
    tag: "Perbandingan wilayah",
  },
  {
    src: "/peta_timestamp.png",
    alt: "Peta Timeline",
    badge: "Timeline",
    title: "Timeline Pergerakan Kasus",
    desc: "Pantau perkembangan kasus dari waktu ke waktu dengan slider timeline untuk melihat tren penyebaran penyakit.",
    tag: "Tren waktu",
  },
];

export default function MapGallery() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full">
          Fitur Utama
        </span>
        <h2 className="mt-4 text-2xl md:text-3xl font-bold text-blue-950 tracking-tight">
          Tiga Cara Memantau Sebaran Penyakit
        </h2>
        <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Gunakan tampilan yang paling sesuai kebutuhanmu — dari sebaran titik,
          heatmap wilayah, hingga timeline pergerakan kasus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {maps.map((map) => (
          <div
            key={map.title}
            className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
          >
            <div className="relative overflow-hidden">
              <Image
                src={map.src}
                alt={map.alt}
                width={400}
                height={220}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 backdrop-blur-sm text-blue-800 px-3 py-1 rounded-full border border-blue-100">
                {map.badge}
              </span>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-blue-950">
                {map.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {map.desc}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {map.tag}
                </span>
                <Link
                  href="/map"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  Buka peta ↗
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
