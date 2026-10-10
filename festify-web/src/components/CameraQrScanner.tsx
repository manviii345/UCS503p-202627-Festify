import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraQrScannerProps {
  onScanSuccess: (qrToken: string) => void;
  onScanError?: (error: string) => void;
}

export default function CameraQrScanner({ onScanSuccess, onScanError }: CameraQrScannerProps) {
  const [manualToken, setManualToken] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'html5qr-code-full-region';

  const startCamera = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }
      setScanStatus('scanning');
      setCameraActive(true);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanStatus('success');
          stopCamera();
          onScanSuccess(decodedText);
        },
        (err) => {
          // ignore transient frame scanning errors
        }
      );
    } catch (err: any) {
      console.warn('Camera failed to start, fallback to manual input mode', err);
      setCameraActive(false);
      setScanStatus('error');
      setErrorMessage(err?.message || 'Could not access camera device. Please paste QR token manually.');
      if (onScanError) onScanError(err?.message || 'Camera access error');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Failed to stop camera scanner', err);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onScanSuccess(manualToken.trim());
      setManualToken('');
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 font-fredoka">
      <div className="w-full bg-[#1A1A1A] text-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex flex-col items-center relative overflow-hidden">
        <div id={elementId} className="w-full max-w-[280px] h-[280px] bg-black/80 rounded-xl overflow-hidden mb-3 border border-white/20 flex items-center justify-center text-xs text-white/60">
          {!cameraActive && (
            <div className="p-4 text-center">
              <span className="text-3xl block mb-2">📷</span>
              <p className="font-semibold text-xs">Camera scanner inactive</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-3 px-3 py-1.5 bg-[#F4C430] text-[#1A1A1A] text-xs font-bold rounded-lg border border-[#1A1A1A] hover:bg-[#F06E38] hover:text-white transition-colors"
              >
                Start Camera
              </button>
            </div>
          )}
        </div>

        {cameraActive && (
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Live Gate Camera Scanning...</span>
          </div>
        )}

        {errorMessage && (
          <p className="text-[11px] text-rose-400 font-semibold mb-2 text-center">{errorMessage}</p>
        )}
      </div>

      {/* Manual Paste Fallback */}
      <div className="w-full bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-2xl p-4 shadow-[3px_3px_0px_#1A1A1A]">
        <h4 className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>⌨️</span> Desktop Testing / Manual Token Paste
        </h4>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste JWT QR Token string here..."
            className="flex-1 px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-[#F06E38]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#F4C430] text-[#1A1A1A] text-xs font-bold rounded-xl border-2 border-[#1A1A1A] hover:bg-[#F06E38] hover:text-white transition-colors shadow-[2px_2px_0px_#1A1A1A]"
          >
            Submit Pass
          </button>
        </form>
      </div>
    </div>
  );
}
