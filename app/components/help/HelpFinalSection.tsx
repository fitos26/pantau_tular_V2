import React from 'react';
import BackgroundCircle from '../BackgroundCircle';

export default function HelpFinalSection() {
    return (
        <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center my-20 relative px-8">
          <h2 className="text-2xl font-bold mb-6 z-10">Setelah melakukan pencarian,</h2>
          <BackgroundCircle size={{ width: "400px", height: "200px" }} position="left-1/10"/>
          <BackgroundCircle size={{ width: "400px", height: "100px" }} position="left-3/4"/>
        
          <p className="text-gray-700 z-10 max-w-3xl font-medium">
            Pengguna akan melihat hasil dalam bentuk peta interaktif atau 
            daftar yang mencakup informasi lengkap tentang penyakit yang dicari. 
            Pengguna juga dapat mengakses sumber berita asli untuk informasi lebih lanjut.
          </p>
          
          <p className="text-gray-700 mt-6 z-10 max-w-3xl font-medium">
            <span className="font-bold">Catatan:</span>
            {' '}
            Platform <i>PantauTular</i> bertujuan untuk memberikan informasi yang 
            akurat dan terkini tentang sebaran penyakit menular di Indonesia. 
            Namun, <i className="font-semibold">pengguna dihimbau untuk selalu 
            memverifikasi informasi lebih lanjut</i> dari sumber resmi sebelum 
            mengambil tindakan apa pun terkait kesehatan mereka.
          </p>
        </div>
    );
}