export default function HelpTitle() {
    return (
        <div>
            <h1 className="text-4xl font-bold text-blue-900 text-center mt-24 mb-12">
                Bantuan PantauTular
            </h1>

            <p className="text-gray-800 text-center font-medium">
                <span className="italic font-semibold">PantauTular</span> sebagai platform
                yang memungkinkan pengguna untuk melacak sebaran penyakit menular di
                wilayah Indonesia{" "}
                <span className="italic font-semibold">menyediakan informasi</span> terkait
                penyakit menular berdasarkan berbagai kriteria, seperti{" "}
                <span className="italic font-semibold">
                Nama Penyakit, Lokasi, Sumber Berita, Tanggal Kejadian
                </span>
                , dan{" "}
                <span className="italic font-semibold">Tingkat Kewaspadaan</span>.
            </p>
        </div>
    );
}