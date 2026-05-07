"use client";

import { useEffect, useState } from "react";
import { ClimatePeriod } from "../../../types";

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Agu" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Okt" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Des" },
];

interface ClimatePeriodControlProps {
  value: ClimatePeriod | null;
  onApply: (value: ClimatePeriod | null) => void;
}

export default function ClimatePeriodControl({
  value,
  onApply,
}: Readonly<ClimatePeriodControlProps>) {
  const [year, setYear] = useState(value?.year ? String(value.year) : "");
  const [month, setMonth] = useState(value?.month ? String(value.month) : "");

  useEffect(() => {
    setYear(value?.year ? String(value.year) : "");
    setMonth(value?.month ? String(value.month) : "");
  }, [value]);

  const applyPeriod = () => {
    const parsedYear = Number.parseInt(year, 10);
    const parsedMonth = Number.parseInt(month, 10);
    onApply({
      year: Number.isFinite(parsedYear) ? parsedYear : null,
      month: Number.isFinite(parsedMonth) ? parsedMonth : null,
    });
  };

  const resetPeriod = () => {
    setYear("");
    setMonth("");
    onApply(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white/95 p-2 text-xs shadow">
      <span className="font-semibold text-gray-700">Iklim</span>
      <select
        className="h-8 rounded border border-gray-300 bg-white px-2"
        value={month}
        onChange={(event) => setMonth(event.target.value)}
        aria-label="Bulan data iklim"
      >
        <option value="">Bulan</option>
        {MONTHS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <input
        className="h-8 w-20 rounded border border-gray-300 px-2"
        inputMode="numeric"
        maxLength={4}
        placeholder="Tahun"
        value={year}
        onChange={(event) => setYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
        aria-label="Tahun data iklim"
      />
      <button
        type="button"
        className="h-8 rounded bg-blue-600 px-3 font-semibold text-white"
        onClick={applyPeriod}
      >
        Terapkan
      </button>
      <button
        type="button"
        className="h-8 rounded border border-gray-300 px-3 font-semibold text-gray-700"
        onClick={resetPeriod}
      >
        Terbaru
      </button>
    </div>
  );
}
