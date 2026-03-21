"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Store } from "lucide-react";

export default function QRPage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!url) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-md w-full text-center relative overflow-hidden border border-gray-100">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-green-500 transform -skew-y-6 origin-top-left -z-0"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-lg mx-auto mb-6 transform -translate-y-4">
            <Store size={40} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-2">Scan & Order!</h1>
          <p className="text-gray-500 font-medium mb-8">
            Point your camera at this QR code to view our catalog and place an order instantly via WhatsApp.
          </p>

          <div className="bg-white p-6 rounded-3xl shadow-md inline-block border-2 border-gray-100 mb-8 mx-auto hover:scale-105 transition-transform">
            <QRCodeSVG 
              value={url} 
              size={240} 
              level="H"
              fgColor="#052e16" // Very dark green
              bgColor="#ffffff"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            {process.env.NEXT_PUBLIC_SHOP_NAME || "Palathingal Stores"}
          </h2>
          <p className="text-sm font-bold text-green-600 tracking-widest uppercase mt-1">
            Free Delivery*
          </p>
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="mt-8 flex items-center space-x-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl shadow-lg transition-colors font-bold active:scale-95 print:hidden"
      >
        <Printer size={20} />
        <span>Print Poster</span>
      </button>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
