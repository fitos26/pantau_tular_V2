// app/components/LocationPermissionPopup.tsx
import React, { useEffect, useState } from "react";
import { LocationService } from "../../services/LocationService";
import { 
  Overlay, 
  Modal, 
  WarningHeader, 
  Message, 
  ButtonContainer, 
  Button 
} from "../../styles/LocationPermissionPopup.styles";

interface LocationPermissionPopupProps {
  onClose: () => void;
  onAllow: () => void;
  onDeny: () => void;
  open?: boolean;
}

const LocationPermissionPopup: React.FC<LocationPermissionPopupProps> = ({
  onClose,
  onAllow,
  onDeny,
  open
}) => {
  const [showPopup, setShowPopup] = useState(false);
  
  useEffect(() => {
    if (open) {
      // Only check permission when explicitly opened via the prop
      LocationService.checkPermission().then((permissionStatus) => {
        if (permissionStatus.state !== "granted") {
          setShowPopup(true);
        } else {
          onAllow();
          onClose();
        }
      });
    } else {
      setShowPopup(false);
    }
  }, [open, onAllow, onClose]);

  const handleAllow = () => {
    // Use LocationService to request location
    LocationService.requestLocation(
      () => {
        setShowPopup(false);
        onAllow();
        onClose();
      },
      () => {
        setShowPopup(false);
        onDeny();
        onClose();
      }
    );
  };

  const handleDeny = () => {
    setShowPopup(false);
    onClose();
  };

  if (!showPopup) return null;

  return (
    <Overlay>
      <Modal>
        <WarningHeader>Izin Lokasi Diperlukan</WarningHeader>
        <Message>
          Fitur ini membutuhkan akses lokasi Anda. 
          Izinkan akses?
        </Message>
        <ButtonContainer>
          <Button onClick={handleDeny}>Batal</Button>
          <Button $primary onClick={handleAllow}>Lanjutkan</Button>
        </ButtonContainer>
      </Modal>
    </Overlay>
  );
};

export default LocationPermissionPopup;