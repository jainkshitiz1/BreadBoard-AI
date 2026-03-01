import { ArrowLeftRight, Settings, Plus, Trash2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BOMItem {
  id: number;
  name: string;
  desc: string;
  type: string;
  stock: string;
}

interface BOMCardProps {
  items: BOMItem[];
  onDelete: (id: number) => void;
  onAdd: () => void;
  onSwap: (id: number) => void;
}

export function BOMCard({ items, onDelete, onAdd, onSwap }: BOMCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col shadow-lg shadow-black/50">
      <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-cyan-400 font-mono text-sm tracking-wider uppercase flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Bill of Materials
        </h3>
        <button className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 hover:border-cyan-400/30 hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-slate-200 font-medium text-sm flex items-center gap-2">
                      {item.name}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        item.stock === 'Order' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 
                        item.stock === 'Low Stock' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                        'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      }`}>
                        {item.stock}
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs font-mono mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-md hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-slate-600 font-mono bg-slate-900/50 px-2 py-1 rounded">
                    {item.type}
                  </span>
                  <button 
                    onClick={() => onSwap(item.id)}
                    className="group/btn flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/50 hover:border-cyan-400/50 rounded text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-all"
                  >
                    <ArrowLeftRight className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" />
                    Swap / Jugaad
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <button 
          onClick={onAdd}
          className="w-full py-2 border border-dashed border-slate-600 hover:border-lime-400 text-slate-500 hover:text-lime-400 rounded-lg flex items-center justify-center gap-2 transition-all text-xs font-mono uppercase tracking-wide group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Add Component manually
        </button>
      </div>
    </div>
  );
}
