import BackgroundCircle from "../components/BackgroundCircle";
import SectionContainer from "../components/about/SectionContainer";
import Navbar from "../components/Navbar";
import Image from "next/image";

export default function About() {
  return (
    <>
    <div className="relative z-50">
      <Navbar />
    </div>
    <section className="flex flex-col items-center justify-center min-h-screen px-6 bg-white z-10">
      <h1 className="text-4xl font-bold text-blue-900 text-center mt-36 mb-10">
        Tentang PantauTular
      </h1>

      <SectionContainer className="text-center mt-10 mb-10 z-0">
        <p className="text-[525252]">
          <strong className="italic">PantauTular</strong> adalah platform inovatif penyedia informasi sebaran penyakit menular di seluruh wilayah Indonesia. Bekerja sama dengan Badan Riset dan Inovasi Nasional (BRIN), PantauTular berkomitmen untuk menyajikan data yang akurat dan terkini tentang kondisi kesehatan masyarakat sehingga memungkinkan pengguna untuk memantau dan mengantisipasi penyebaran penyakit menular dengan lebih efektif.
        </p>
      </SectionContainer>

      <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center gap-8 mt-10 mb-16">
        <div className="flex-1 flex justify-center">
          <Image 
            src="/tentang_kami.jpeg" 
            alt="PantauTular_tentang_kami"
            width={500}
            height={300}
            className="w-full max-w-md h-auto"/>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="heading-primary">
            Melalui <em>PantauTular</em>,
          </h2>
          <p className="paragraph-primary">
            Pengguna dapat dengan mudah mengakses peta interaktif yang menampilkan titik-titik lokasi di mana penyakit menular telah terdeteksi. Informasi ini disajikan secara real-time, membantu individu, komunitas, serta pihak berwenang untuk mengambil tindakan pencegahan yang tepat, seperti isolasi diri, vaksinasi, atau langkah-langkah lain yang diperlukan untuk melindungi diri dan orang-orang terdekat.
          </p>
        </div>
      </div>

      <SectionContainer className="flex flex-col text-center mt-10 mb-10 relative z-0">
        <BackgroundCircle size={{ width: "720px", height: "200px" }} position="left-1/2"/>        
        <h2 className="text-2xl font-bold mb-4 z-10">Kami memahami pentingnya</h2>
        <p className="relative text-[525252] z-10">
          <strong className="italic">akses cepat dan mudah</strong> terhadap informasi kesehatan, terutama dalam situasi krisis. Oleh karena itu, PantauTular dirancang dengan <strong className="italic">antarmuka yang ramah pengguna</strong> dan <strong className="italic">dapat diakses melalui berbagai platform</strong>, termasuk web dan mobile, sehingga memungkinkan siapa pun untuk memanfaatkannya tanpa hambatan.
        </p>
      </SectionContainer>

      <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center gap-8 mb-20 mt-20">
        <div className="flex-1 text-center md:text-right">
          <h2 className="heading-primary">
            Latar Belakang <em>PantauTular</em>
          </h2>
          <p className="paragraph-primary">
            Pembuatan <strong className="italic"> PantauTular</strong> dipicu oleh kebutuhan akan sumber informasi yang handal dan terpercaya mengenai penyebaran penyakit menular di Indonesia. Kami menyadari bahwa dalam menghadapi ancaman kesehatan seperti pandemi atau wabah penyakit, informasi yang tepat waktu dan akurat dapat menjadi kunci untuk mengurangi risiko penularan dan meminimalkan dampak yang ditimbulkan.
          </p>
        </div>

        <div className="flex-1 flex justify-center">
          <Image 
            src="/latar_belakang.jpeg" 
            alt="PantauTular_latar_belakang" 
            width={500}
            height={300}
            className="w-full max-w-md h-auto" />
        </div>
      </div>

      <SectionContainer className="flex flex-col text-center mt-10 mb-20 z-0">
        <h2 className="text-2xl font-bold mb-4 z-10">Dengan demikian,</h2>
        <BackgroundCircle size={{ width: "400px", height: "200px" }} position="left-1/10"/>
        <BackgroundCircle size={{ width: "400px", height: "100px" }} position="left-3/4"/>
        <p className="text-[525252] z-10">
          kami mengumpulkan <strong className="italic">tim ahli dalam bidang kesehatan dan teknologi informasi</strong> untuk mengembangkan platform yang dapat memberikan solusi konkret bagi masyarakat Indonesia. Kami berkomitmen untuk menyediakan sumber informasi yang dapat diandalkan, mudah diakses, dan dapat dipahami oleh semua lapisan masyarakat, sehingga setiap individu dapat berperan aktif dalam menjaga kesehatan diri dan komunitasnya.
        </p>
        <p className="text-[525252] mt-3 z-10">
        <strong className="italic">PantauTular menjadi wujud kolaborasi</strong> antara inovasi teknologi dan kepedulian terhadap kesehatan masyarakat, oleh karena itu diharapkan <strong className="italic">PantauTular dapat terus berkembang dan memberikan manfaat</strong> yang nyata bagi Indonesia.
        </p>
      </SectionContainer>

    </section>
    </>
  );
}