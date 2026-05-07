import { render, screen, fireEvent } from '@testing-library/react';
import NoDataPopup from '../../../app/components/NoDataPopup';
import '@testing-library/jest-dom';

describe('NoDataPopup', () => {
  test("renders the popup correctly", () => {
    render(<NoDataPopup onClose={jest.fn()} />);

    expect(screen.getByText("Data Tidak Ditemukan")).toBeInTheDocument();

    expect(screen.getByText(/Maaf, data belum tersedia atau tidak ditemukan data yang sesuai/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Tutup" })).toBeInTheDocument();
  });
  
  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<NoDataPopup onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Tutup'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("does not call onClose when popup is rendered", () => {
    const mockOnClose = jest.fn();
    render(<NoDataPopup onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
  
  test('handles null onClose prop gracefully', () => {
    render(<NoDataPopup onClose={null as any} />);
    
    expect(screen.getByText('Data Tidak Ditemukan')).toBeInTheDocument();
    
    expect(() => {
      fireEvent.click(screen.getByText('Tutup'));
    }).not.toThrow();
  });
  
  test('handles multiple rapid clicks correctly', () => {
    const mockOnClose = jest.fn();
    render(<NoDataPopup onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('Tutup');
    
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(3);
  });
});