import React from "react";
import { 
    Overlay, 
    Modal, 
    PopupHeader, 
    Message, 
    ButtonContainer, 
    Button 
  } from "../../styles/MapLoadErrorPopup.styles";

interface MapLoadErrorPopupProps {
  message: string;
  onClose: () => void;
}

const MapLoadErrorPopup: React.FC<MapLoadErrorPopupProps> = ({ message, onClose }) => {
  if (!message) {
    return null;
  }
  
  return (
    <Overlay>
      <Modal>
        <PopupHeader>Terjadi Kesalahan</PopupHeader>
        <Message>{message}</Message>
        <ButtonContainer>
          <Button onClick={onClose}>Tutup</Button>
        </ButtonContainer>
      </Modal>
    </Overlay>
  );
};

export default MapLoadErrorPopup;