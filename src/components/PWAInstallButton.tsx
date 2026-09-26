import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Sparkles } from 'lucide-react';
import { APKModal } from './APKModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleClick = async () => {
    // If native prompt is available on Android/Chrome, attempt install directly, or open APK modal
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const installed = await install();
        if (!installed) {
          setShowModal(true);
        }
      } catch {
        setShowModal(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        id="apk-download-install-btn"
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow transition-all cursor-pointer border border-emerald-500/50"
        title="Android ॲप इन्स्टॉल करा / APK तयार करा"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-100" />
        <span>{isInstalled ? 'APK / ॲप माहिती' : 'APK / ॲप इन्स्टॉल'}</span>
        {!isInstalled && (
          <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
        )}
      </button>

      <APKModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
