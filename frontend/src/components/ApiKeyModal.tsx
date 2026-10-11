import React from 'react';
import SettingsModal from './SettingsModal';

interface ApiKeyModalProps {
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onKeyUpdated }) => {
  return (
    <SettingsModal
      onClose={onClose}
      systemStatus={null}
      onStatusUpdated={onKeyUpdated}
    />
  );
};

export default ApiKeyModal;
