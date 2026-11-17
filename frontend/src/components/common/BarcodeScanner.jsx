import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const hasScanned = useRef(false);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.AZTEC,
          Html5QrcodeSupportedFormats.PDF_417,
        ];

        html5QrCode = new Html5Qrcode("reader", {
          formatsToSupport: formatsToSupport,
          useBarCodeDetectorIfSupported: false, // Force ZXing – supports all 1D formats reliably
          verbose: false,
        });

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width:  Math.min(Math.round(viewfinderWidth * 0.85), 300),
              height: Math.min(Math.round(viewfinderHeight * 0.70), 250),
            }),
          },
          (decodedText) => {
            // Fire only once per scanner open
            if (hasScanned.current) return;
            hasScanned.current = true;
            html5QrCode
              .stop()
              .catch(() => {})
              .finally(() => {
                try { html5QrCode.clear(); } catch (_) {}
                if (onScan) onScan(decodedText);
              });
          },
          () => { /* frame-level decode errors – ignore */ }
        );
        setIsScanning(true);
      } catch (err) {
        setError("Failed to start camera. Please ensure camera permissions are granted.");
        console.error(err);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(() => {}).finally(() => {
              try { html5QrCode.clear(); } catch (_) {}
            });
          } else {
            try { html5QrCode.clear(); } catch (_) {}
          }
        } catch (_) {}
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Camera className="w-5 h-5 text-slate-700" />
            Scan Barcode / QR Code
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-black flex items-center justify-center min-h-[280px]">
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/95 dark:bg-slate-900/95 z-10 gap-3">
              <span className="text-3xl">📷</span>
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-black/60">
              <p className="text-sm animate-pulse">Initializing camera…</p>
            </div>
          )}

          {/* html5-qrcode mounts its video element here */}
          <div id="reader" className="w-full" />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Align the code inside the viewfinder to scan automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
