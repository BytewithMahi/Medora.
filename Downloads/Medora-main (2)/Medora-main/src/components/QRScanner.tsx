import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
    title?: string;
}

export default function QRScanner({ onScanSuccess, onClose, title = "Scan QR Code" }: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialise scanner
        scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            },
            /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText) => {
                // Success
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                }
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Error/Scanning (usually ignore to prevent spamming console)
                // console.log(errorMessage);
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScanSuccess]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-md relative flex flex-col"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative bg-black rounded-2xl overflow-hidden border border-white/5 max-h-[400px]">
                    <div id="qr-reader" className="w-full h-full"></div>
                    
                    {/* Futuristic Scanning Overlay Frame */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[250px] h-[250px] border-2 border-cyan-400/30 rounded-2xl relative">
                            {/* Corners */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                            
                            {/* Scan line animation */}
                            <motion.div 
                                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    </div>
                </div>

                <p className="text-center text-white/50 text-sm mt-4">
                    Position the QR code inside the frame to scan.
                </p>
            </motion.div>
        </motion.div>
    );
}
