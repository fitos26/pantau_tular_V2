import ButtonWithArrow from "../ButtonWithArrow";
import Image from "next/image";

export default function HelpSection() {
  return (
    <section className="w-full py-12 px-6 pb-32 bg-slate-50">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex justify-center">
          <Image
            src="/tentang_kami.jpeg"
            alt="Bantuan PantauTular"
            width={420}
            height={300}
            className="rounded-2xl shadow-md object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col items-start gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full">
            Pusat Bantuan
          </span>

          <h2 className="text-2xl md:text-3xl font-bold text-blue-950 tracking-tight leading-snug">
            Butuh Bantuan<br />Menggunakan PantauTular?
          </h2>

          <p className="text-sm text-slate-500 leading-relaxed">
            Temukan panduan penggunaan lengkap — mulai dari pencarian penyakit
            berdasarkan nama, lokasi, sumber berita, tanggal kejadian, hingga
            tingkat kewaspadaan wilayah.
          </p>

          <ButtonWithArrow href="/help">Baca Selengkapnya</ButtonWithArrow>
        </div>
      </div>
    </section>
  );
}
