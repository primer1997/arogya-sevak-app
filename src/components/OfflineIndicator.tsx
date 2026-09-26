import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-xl border border-amber-500 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-100 flex-shrink-0" />
      <span>ऑफलाईन मोड चालू आहे — सर्व डेटा फोनवर सुरक्षित साठवला जात आहे.</span>
    </div>
  );
};
