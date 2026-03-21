import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-white/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center">
        <Loader2 size={32} className="text-green-600 animate-spin mb-2" />
        <span className="text-sm font-bold text-gray-700">Loading Palathingal Stores...</span>
      </div>
    </div>
  );
}
