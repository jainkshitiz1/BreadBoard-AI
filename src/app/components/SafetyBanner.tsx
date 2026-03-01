import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface SafetyBannerProps {
  onDismiss: () => void;
}

export function SafetyBanner({ onDismiss }: SafetyBannerProps) {
  const handleViewDatasheet = () => {
    toast.info("Opening Datasheets...", {
        description: "Redirecting to manufacturer safety portal (simulation)."
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-4 shadow-[0_0_15px_rgba(239,68,68,0.2)] relative overflow-hidden group hover:bg-red-500/15 transition-colors h-full"
    >
      <div className="absolute top-0 right-0 p-2">
        <button 
            onClick={onDismiss}
            className="text-red-400 hover:text-red-200 transition-colors p-1 rounded-full hover:bg-red-500/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="bg-red-500/20 p-3 rounded-full flex-shrink-0 animate-pulse">
        <AlertTriangle className="w-6 h-6 text-red-500 shadow-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      </div>
      
      <div className="flex-1">
        <h3 className="text-red-400 font-bold text-lg flex items-center gap-2 mb-1 tracking-wide">
          SAFETY WARNINGS DETECTED
          <ShieldAlert className="w-4 h-4 text-red-400 opacity-50" />
        </h3>
        <ul className="text-red-300/80 text-sm space-y-1.5 font-mono list-disc list-inside mt-2">
          <li>
            <span className="font-bold text-red-300">High Voltage:</span> Ensure mains isolation for the relay circuit.
          </li>
          <li>
            <span className="font-bold text-red-300">Current Limit:</span> Check LED series resistor value (calculated: 220Ω).
          </li>
          <li>
            <span className="font-bold text-red-300">Heat Dissipation:</span> LM358 may require a heatsink if driving loads &gt; 20mA.
          </li>
        </ul>
        
        <div className="mt-4 flex gap-3">
            <button 
                onClick={onDismiss}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
                Acknowledge Risks
            </button>
            <button 
                onClick={handleViewDatasheet}
                className="px-4 py-1.5 border border-red-500/30 hover:border-red-500 text-red-400 text-xs font-bold uppercase tracking-wider rounded transition-all active:scale-95 hover:bg-red-500/10"
            >
                View Safety Datasheets
            </button>
        </div>
      </div>
      
      {/* Background Glitch Effect */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)] pointer-events-none opacity-50"></div>
    </motion.div>
  );
}
