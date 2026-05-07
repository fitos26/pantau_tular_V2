import ButtonWithArrow from "../ButtonWithArrow";
import Image from "next/image";

export default function AboutSection() {
  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col items-start gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full">
            Tentang Kami
          </span>

          <h2 className="text-2xl md:text-3xl font-bold text-blue-950 tracking-tight leading-snug">
            Latar Belakang<br />PantauTular
          </h2>

          <p className="text-sm text-slate-500 leading-relaxed">
            <strong className="text-blue-700 font-semibold not-italic">PantauTular</strong> hadir
            untuk mewujudkan pemantauan dan pencegahan penyakit menular di Indonesia
            berbasis data yang akurat, terkini, dan mudah diakses oleh semua kalangan.
          </p>

          <ButtonWithArrow href="/about">Pelajari Lebih Lanjut</ButtonWithArrow>
        </div>

        <div className="flex-1 flex justify-center">
          <Image
            src="/latar_belakang.jpeg"
            alt="Latar belakang PantauTular"
            width={420}
            height={300}
            className="rounded-2xl shadow-md object-cover"
          />
        </div>
      </div>
    </section>
  );
}
