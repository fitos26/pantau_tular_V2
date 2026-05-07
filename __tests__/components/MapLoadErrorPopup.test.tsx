import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import MapLoadErrorPopup from "../../app/components/MapLoadErrorPopup";

const mockOnClose = jest.fn();

describe("MapLoadErrorPopup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("me-render message error", async () => {
    render(
    <MapLoadErrorPopup
        message="Gagal memuat peta, silakan coba lagi"
        onClose={mockOnClose}
    />);

    expect(screen.getByText("Gagal memuat peta, silakan coba lagi")).toBeInTheDocument();
  });

  test("menampilkan tombol 'Tutup'", () => {
    render(
      <MapLoadErrorPopup
        message="Gagal memuat peta"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole("button", { name: /tutup/i })).toBeInTheDocument();
  });

  test("memanggil 'onClose; ketika tombol 'Tutup' ditekan", async () => {
    render(
      <MapLoadErrorPopup
        message="Gagal memuat peta, silakan coba lagi"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("Tutup"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("merender error message yang dinamis", async () => {
    const errorMessage = "Gagal memuat peta, silakan coba lagi";
    render(
      <MapLoadErrorPopup
        message={errorMessage}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test("tidak error jika message kosong", () => {
    render(<MapLoadErrorPopup message="" onClose={mockOnClose} />);
    expect(screen.queryByText("Terjadi Kesalahan")).not.toBeInTheDocument();
  });

  test("tidak error jika message null", () => {
    render(<MapLoadErrorPopup message={null as any} onClose={mockOnClose} />);
    expect(screen.queryByText("Terjadi Kesalahan")).not.toBeInTheDocument();
  });
});