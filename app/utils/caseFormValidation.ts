export function validateFormState(input: {
  jenisPenyakit?: string;
  lokasi?: string;
  tanggal?: { dd?: string; mm?: string; yyyy?: string };
  sumberBerita?: string;
  usia?: string;
}) {
  const {
    jenisPenyakit = "",
    lokasi = "",
    tanggal = { dd: "", mm: "", yyyy: "" },
    sumberBerita = "",
    usia = "",
  } = input;
  const next: Record<string, string> = {};

  if (!jenisPenyakit) next.jenisPenyakit = "Jenis penyakit wajib diisi.";
  if (!lokasi) next.lokasi = "Lokasi wajib diisi.";

  const dd = parseInt(tanggal.dd || "0", 10);
  const mm = parseInt(tanggal.mm || "0", 10);
  const yyyy = parseInt(tanggal.yyyy || "0", 10);
  if (tanggal.dd || tanggal.mm || tanggal.yyyy) {
    if (!(dd >= 1 && dd <= 31)) next.tanggal = "Format hari tidak valid (1-31).";
    if (!(mm >= 1 && mm <= 12)) {
      next.tanggal = next.tanggal
        ? `${next.tanggal} / Bulan tidak valid (1-12).`
        : "Format bulan tidak valid (1-12).";
    }
    if (!(yyyy >= 1900 && yyyy <= 2100)) {
      next.tanggal = next.tanggal
        ? `${next.tanggal} / Tahun tidak valid.`
        : "Format tahun tidak valid (1900-2100).";
    }
  }

  if (sumberBerita) {
    const maybeUrl = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/.test(sumberBerita.trim());
    if (!maybeUrl) {
      next.sumberBerita =
        "Masukkan sumber berita yang valid (contoh: https://bandung.kompas.com atau bandung.kompas.com).";
    }
  }

  if (usia && !/^\d+$/.test(usia.trim())) {
    next.usia = "Masukkan usia yang valid.";
  }

  return next;
}
