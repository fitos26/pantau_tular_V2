import React from "react";
import {
    Overlay,
    Modal,
    PopupHeader,
    Message,
    ButtonContainer,
    Button
  } from "../../styles/MapLoadErrorPopup.styles";

interface NoDataPopupProps {
  onClose: () => void;
}

const NoDataPopup: React.FC<NoDataPopupProps> = ({ onClose }) => {
 
  return (
    <Overlay>
      <Modal>
        <PopupHeader>Data Tidak Ditemukan</PopupHeader>
        <Message>Maaf, data belum tersedia atau tidak ditemukan data yang sesuai dengan filter. Silakan coba lagi nanti atau ubah filter pencarian Anda.</Message>
        <ButtonContainer>
          <Button onClick={onClose}>Tutup</Button>
        </ButtonContainer>
      </Modal>
    </Overlay>
  );
};

export default NoDataPopup;