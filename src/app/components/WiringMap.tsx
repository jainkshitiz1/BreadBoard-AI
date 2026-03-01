import { Share2, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

interface Connection {
  id: number;
  source: string;
  dest: string;
  type: string;
}

interface WiringMapProps {
  connections: Connection[];
}

export function WiringMap({ connections }: WiringMapProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col shadow-lg shadow-black/50 relative group">
        <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lime-400 font-mono text-sm tracking-wider uppercase flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Wiring Map
          </h3>
          <Dialog.Trigger asChild>
            <button className="text-slate-500 hover:text-lime-400 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </Dialog.Trigger>
        </div>
        
        <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur text-xs font-mono uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Source Pin</th>
                <th className="px-4 py-3 font-medium">Destination Pin</th>
                <th className="px-4 py-3 font-medium text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono text-xs">
              {connections.map((conn, index) => (
                <motion.tr 
                  key={conn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-800/30 transition-colors group/row"
                >
                  <td className="px-4 py-3 font-medium text-cyan-300 relative">
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
                      {conn.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-lime-300 relative">
                     <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_5px_rgba(132,204,22,0.5)]"></div>
                      {conn.dest}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 group-hover/row:text-slate-400">
                    {conn.type}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]" style={{ backgroundSize: "24px 24px" }}></div>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-700 bg-slate-900 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex flex-col gap-4 h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <Dialog.Title className="text-lg font-semibold text-lime-400 font-mono flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                FULL SCHEMATIC VIEW
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Detailed view of the wiring schematic connections
              </Dialog.Description>
              <Dialog.Close className="rounded-full p-2 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>
            
            <div className="flex-1 bg-slate-950/50 rounded-lg border border-slate-800 p-8 flex items-center justify-center relative overflow-hidden">
               {/* Placeholder for a real graph visualization */}
               <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950"></div>
               <div className="text-center">
                 <Share2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                 <p className="text-slate-500 font-mono text-sm">Interactive Node Graph Visualization Placeholder</p>
                 <p className="text-slate-600 text-xs mt-2">Double-click nodes to edit pin assignments</p>
               </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
