import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, X, MessageSquare } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryText: string;
  reportingMonth: string;
  subCentreName: string;
}

/**
 * Fallback clipboard copy that works even inside sandboxed iframes without clipboard permissions
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // 2. Fallback using temporary textarea and document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryText,
  reportingMonth,
  subCentreName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(summaryText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = async () => {
    const encoded = encodeURIComponent(summaryText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    // Use https://api.whatsapp.com/send which works on both desktop and mobile.
    // Inside the installed app, window.open('_blank') is swallowed by the
    // WebView, so open the system browser instead — it deep-links into WhatsApp.
    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.open({ url });
      } catch (err) {
        console.error('Browser open failed:', err);
      }
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="whatsapp-summary-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="whatsapp-summary-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#128C7E] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">
                WhatsApp अहवाल सारांश
              </h3>
              <p className="text-[11px] text-emerald-100">
                {subCentreName} | माहे: {reportingMonth}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="बंद करा"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview & Notice */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>तयार केलेला संदेश (खालील संदेश कॉपी करा किंवा थेट WhatsApp वर पाठवा):</span>
            <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {summaryText.length} अक्षरे
            </span>
          </div>

          {/* Textarea pre-formatted preview */}
          <div className="relative">
            <textarea
              readOnly
              value={summaryText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              rows={12}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-sans text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed select-all"
            />
          </div>

          {copied && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>संपूर्ण संदेश क्लिपबोर्डवर कॉपी झाला आहे! तुम्ही WhatsApp वर पेस्ट करू शकता.</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            बंद करा
          </button>

          <div className="flex items-center gap-2">
            <button
              id="whatsapp-copy-btn"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'कॉपी झाले!' : 'संदेश कॉपी करा'}</span>
            </button>

            <button
              id="whatsapp-open-btn"
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-950" />
              <span>थेट WhatsApp उघडा</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
