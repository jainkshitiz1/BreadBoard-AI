import { Camera, X, RefreshCcw, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { GeminiAnalyst } from '../../lib/gemini';

export function DebugFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const startScan = async () => {
    setIsScanning(true);
    setAiReport("Initiating Logical SPICE compilation & Gemini Analysis...");

    const result = await GeminiAnalyst.analyzeCircuit();
    setAiReport(result);
    setIsScanning(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-full bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold font-mono shadow-[0_0_25px_rgba(132,204,22,0.6)] group border-2 border-lime-300 transition-colors"
        >
          <div className="absolute inset-0 bg-lime-400 rounded-full animate-ping opacity-20 pointer-events-none"></div>
          <Camera className="w-6 h-6 fill-current" />
          <span>DEBUG BREADBOARD</span>
        </motion.button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-700 bg-slate-950 p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-2xl overflow-hidden h-[85vh]">

          <div className="relative h-full flex flex-col">
            {/* Camera Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
              <div>
                <Dialog.Title className="text-lime-400 font-mono text-xl font-bold tracking-wider flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                  LIVE DEBUG FEED
                </Dialog.Title>
                <Dialog.Description className="text-slate-400 text-xs font-mono mt-1">
                  AR Overlay Active • 30fps • 1080p
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-full bg-black/50 p-2 text-slate-400 hover:text-white hover:bg-white/20 transition-all border border-white/10">
                <X className="w-6 h-6" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            {/* Camera Viewport (Mock) */}
            <div className="flex-1 bg-slate-900 relative overflow-hidden group">
              {/* Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

              {/* Central Crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-lime-500/30 rounded-lg flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 border-l border-t border-lime-500 absolute top-0 left-0"></div>
                <div className="w-4 h-4 border-r border-t border-lime-500 absolute top-0 right-0"></div>
                <div className="w-4 h-4 border-l border-b border-lime-500 absolute bottom-0 left-0"></div>
                <div className="w-4 h-4 border-r border-b border-lime-500 absolute bottom-0 right-0"></div>
                <div className="w-2 h-2 bg-lime-500/50 rounded-full"></div>
              </div>

              {/* Scanning Effect */}
              {isScanning && (
                <div className="absolute inset-0 bg-lime-500/10 z-0 animate-pulse">
                  <div className="absolute top-0 left-0 w-full h-1 bg-lime-400 shadow-[0_0_20px_#84cc16] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
              )}

              {/* Placeholder Content / Logic Output */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                {!aiReport && !isScanning && (
                  <>
                    <p className="text-slate-600 font-mono text-lg text-center">AI Logic Explorer Offline</p>
                    <p className="text-slate-700 text-sm mt-2 text-center">Click SCAN to analyze the DSU and translate physical nets into SPICE.</p>
                  </>
                )}

                {aiReport && (
                  <div className="w-full h-full max-w-2xl bg-black/60 backdrop-blur-md border border-lime-500/30 rounded-xl p-6 overflow-auto pointer-events-auto custom-scrollbar">
                    <h4 className="text-lime-400 font-mono font-bold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></span>
                      GEMINI ANALYST REPORT
                    </h4>
                    <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">
                      {aiReport}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-center gap-6 relative z-10">
              <button
                onClick={startScan}
                className="flex flex-col items-center gap-2 group/btn"
              >
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center group-hover/btn:border-lime-500 transition-colors bg-slate-800">
                  <div className="w-12 h-12 bg-lime-500 rounded-full group-active/btn:scale-90 transition-transform"></div>
                </div>
                <span className="text-xs font-mono text-slate-400">SCAN</span>
              </button>

              <button className="absolute left-8 bottom-8 flex flex-col items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                <RefreshCcw className="w-6 h-6" />
                <span className="text-[10px] font-mono">RESET</span>
              </button>

              <button className="absolute right-8 bottom-8 flex flex-col items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                <Layers className="w-6 h-6" />
                <span className="text-[10px] font-mono">LAYERS</span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
