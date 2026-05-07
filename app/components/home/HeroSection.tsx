"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ButtonBase from "../ButtonBase";
import { mapApi } from "../../../services/api";
import type { StatisticsData } from "../../../types";

type HeroStatValues = {
  provinceCount: number | null;
  activeCases: number | null;
  latestUpdate: string | null;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const formatCount = (value: number | null, fallback: string) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return numberFormatter.format(value);
};

const formatLatestUpdate = (value: string | null) => {
  if (!value) {
    return "Terkini";
  }

  const updateDate = new Date(value);
  const updateTime = updateDate.getTime();

  if (Number.isNaN(updateTime)) {
    return "Terkini";
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - updateTime) / 60000));

  if (diffMinutes < 1) {
    return "Baru saja";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} mnt`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} hari`;
  }

  return updateDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function HeroSection() {
  const [stats, setStats] = useState<HeroStatValues>({
    provinceCount: null,
    activeCases: null,
    latestUpdate: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadHeroStats = async () => {
      try {
        const data = (await mapApi.getDashboardData()) as StatisticsData;

        if (!isMounted) {
          return;
        }

        setStats({
          provinceCount: data.coverage_statistics?.province_count ?? null,
          activeCases:
            data.severity_statistics?.active_cases ??
            data.severity_statistics?.total_cases ??
            null,
          latestUpdate:
            data.coverage_statistics?.latest_update ??
            data.latest_update ??
            null,
        });
      } catch (error) {
        console.error("Gagal memuat statistik hero:", error);
      }
    };

    loadHeroStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroStats = useMemo(
    () => [
      {
        num: formatCount(stats.provinceCount, "34"),
        label: "Provinsi terpantau",
      },
      {
        num: formatCount(stats.activeCases, "1.200+"),
        label: "Kasus aktif",
      },
      {
        num: formatLatestUpdate(stats.latestUpdate),
        label: "Update data",
      },
    ],
    [stats]
  );

  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-6 bg-white">
      <span className="mt-16 mb-4 text-xs font-semibold uppercase tracking-widest text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full">
        Surveilans Penyakit Menular
      </span>

      <h1 className="text-3xl md:text-4xl font-bold text-blue-950 text-center leading-tight tracking-tight mb-4">
        Pantau Sebaran<br className="hidden md:block" /> Penyakit di Indonesia
      </h1>

      <p className="text-sm md:text-base text-slate-500 text-center max-w-md leading-relaxed mb-8">
        Bekerja sama dengan BRIN, PantauTular menyajikan data akurat dan terkini
        untuk memantau penyebaran penyakit menular secara efektif.
      </p>

      <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center gap-8 mb-4">
        <div className="flex-1 flex justify-center">
          <Image
            src="/home.jpeg"
            alt="PantauTular_home"
            width={400}
            height={300}
            className="rounded-xl object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-blue-900 leading-snug">
            Platform informasi sebaran penyakit menular di Indonesia
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Bekerja sama dengan Badan Riset dan Inovasi Nasional (BRIN),{" "}
            <strong className="text-slate-700">PantauTular</strong> berkomitmen
            menyajikan data yang akurat dan terkini tentang kondisi kesehatan
            masyarakat.
          </p>
          <ButtonBase href="/map">Gunakan Sekarang</ButtonBase>
        </div>
      </div>

      <div className="w-full max-w-sm md:max-w-lg grid grid-cols-3 gap-4 mb-10">
        {heroStats.map((s) => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center min-h-[92px]">
            <p className="text-xl font-bold text-blue-900">{s.num}</p>
            <p className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
