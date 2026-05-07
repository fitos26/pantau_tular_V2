import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../../app/components/Footer";

describe("Footer Component", () => {
  it("menampilkan judul 'Saluran Bantuan'", () => {
    render(<Footer />);
    expect(screen.getByText("Saluran Bantuan")).toBeInTheDocument();
  });

  it("menampilkan hotline Kementerian Kesehatan RI", () => {
    render(<Footer />);
    expect(screen.getByText("Kementerian Kesehatan RI (Kemenkes RI)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hotline: 1500-567" })).toBeInTheDocument();
  });

  it("menampilkan hotline Layanan Masyarakat Sehat", () => {
    render(<Footer />);
    expect(screen.getByText("Layanan Masyarakat Sehat (LMS)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hotline: 0812-1212-3119" })).toBeInTheDocument();
  });

  it("menampilkan hotline Rumah Sakit Penyakit Infeksi Prof. Dr. Sulianti Saroso", () => {
    render(<Footer />);
    expect(screen.getByText("Rumah Sakit Penyakit Infeksi Prof. Dr. Sulianti Saroso")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hotline: \(021\) 6506559 atau \(021\) 6507024/i })).toBeInTheDocument();
  });

  it("menampilkan hotline Pusat Informasi Kesehatan Terpadu", () => {
    render(<Footer />);
    expect(screen.getByText("Pusat Informasi Kesehatan Terpadu (PIKT)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hotline: 0813-7690-5598" })).toBeInTheDocument();
  });

  it("menampilkan credit © PantauTular di kanan bawah", () => {
    render(<Footer />);
    expect(screen.getByText(`© ${new Date().getFullYear()} PantauTular. All rights reserved.`)).toBeInTheDocument();
  });

  it("tidak menampilkan teks yang salah", () => {
    render(<Footer />);
    expect(screen.queryByText("Hotline: 1234-5678")).not.toBeInTheDocument();
    expect(screen.queryByText("Pusat Informasi Kesehatan Nasional")).not.toBeInTheDocument();
  });
});
