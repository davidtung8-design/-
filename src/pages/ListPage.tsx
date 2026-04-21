import React, { useRef } from 'react';
import { PerfData } from '../types';
import { UserPlus, Target, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface ListPageProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  isDarkMode: boolean;
}

export const ListPage: React.FC<ListPageProps> = ({ perfData, setPerfData, isDarkMode }) => {
  const prospectInputRef = useRef<HTMLInputElement>(null);
  const recruitInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (type: 'prospect' | 'recruit', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // Simple CSV Parser
      const rows = content.split('\n').filter(row => row.trim());
      const data = rows.map(row => {
        // Handle quotes if any
        return row.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      });

      if (type === 'prospect') {
         const newList = [...perfData.prospectList];
         data.forEach((item, index) => {
            if (index < 25) {
                newList[index] = {
                    name: item[0] || '',
                    job: item[1] || '',
                    plan: item[2] || '',
                    note: item[3] || ''
                };
            }
         });
         setPerfData(prev => ({ ...prev, prospectList: newList }));
      } else {
         const newList = [...perfData.recruitList];
         data.forEach((item, index) => {
            if (index < 25) {
                newList[index] = {
                    name: item[0] || '',
                    job: item[1] || '',
                    interest: item[2] || '',
                    followup: item[3] || ''
                };
            }
         });
         setPerfData(prev => ({ ...prev, recruitList: newList }));
      }
      
      // Reset input
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-fadeIn space-y-6 pb-12">
      {/* Prospect List Bento Section */}
      <div className={cn(
        "bento-card p-8 group transition-colors duration-300",
        isDarkMode ? "bg-slate-900/40" : "bg-white border-slate-200"
      )}>
        <input 
          type="file" 
          accept=".csv,.txt" 
          className="hidden" 
          ref={prospectInputRef} 
          onChange={(e) => handleImport('prospect', e)} 
        />
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"><Target size={18} /></div>
             <h3 className={cn(
               "text-xs font-bold uppercase tracking-[0.2em]",
               isDarkMode ? "text-slate-400" : "text-slate-500"
             )}>Prospect Intelligence · High-Net-Worth</h3>
           </div>
           <div className="flex items-center gap-4">
             <button 
                onClick={() => prospectInputRef.current?.click()}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    isDarkMode 
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
             >
                <Upload size={12} /> 导入名单 (Import)
             </button>
             <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active nodes: {perfData.prospectList.filter(p => p.name).length} / 25</div>
           </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className={cn(
                "uppercase tracking-tighter border-b",
                isDarkMode ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-200"
              )}>
                <th className="p-4 font-bold"># ID</th>
                <th className="p-4 font-bold">Entity Name</th>
                <th className="p-4 font-bold">Industry / Role</th>
                <th className="p-4 font-bold">Strategic Plan</th>
                <th className="p-4 font-bold">Context / Logs</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800/30" : "divide-slate-100")}>
              {perfData.prospectList.map((p, i) => (
                <tr key={i} className={cn(
                  "transition-colors group",
                  isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-blue-500/[0.02]"
                )}>
                  <td className="p-4 font-mono text-slate-700">{String(i + 1).padStart(2, '0')}</td>
                  <td className="p-2">
                    <input 
                      className={cn(
                        "w-full border border-transparent rounded-lg p-3 outline-none transition-all placeholder:text-slate-800",
                        isDarkMode ? "bg-slate-900/50 text-white focus:border-blue-500" : "bg-slate-50 text-slate-900 focus:border-blue-500"
                      )} 
                      value={p.name} 
                      placeholder="Initialize Entity..."
                      onChange={(e) => {
                        const newList = [...perfData.prospectList];
                        newList[i].name = e.target.value;
                        setPerfData(prev => ({ ...prev, prospectList: newList }));
                      }} />
                  </td>
                  <td className="p-2">
                    <input 
                      className={cn(
                        "w-full border border-transparent rounded-lg p-3 outline-none transition-all placeholder:text-slate-800 text-[10px]",
                        isDarkMode ? "bg-slate-900/50 text-slate-400 focus:border-blue-500" : "bg-slate-50 text-slate-600 focus:border-blue-500"
                      )} 
                      value={p.job} 
                      placeholder="Sector..."
                      onChange={(e) => {
                        const newList = [...perfData.prospectList];
                        newList[i].job = e.target.value;
                        setPerfData(prev => ({ ...prev, prospectList: newList }));
                      }} />
                  </td>
                   <td className="p-2">
                    <input 
                      className={cn(
                        "w-full border border-transparent rounded-lg p-3 outline-none transition-all placeholder:text-slate-800 text-[10px]",
                        isDarkMode ? "bg-slate-900/50 text-blue-400 focus:border-blue-500" : "bg-slate-50 text-blue-600 focus:border-blue-500"
                      )} 
                      value={p.plan} 
                      placeholder="Execution Strategy..."
                      onChange={(e) => {
                        const newList = [...perfData.prospectList];
                        newList[i].plan = e.target.value;
                        setPerfData(prev => ({ ...prev, prospectList: newList }));
                      }} />
                  </td>
                   <td className="p-2">
                    <input 
                      className={cn(
                        "w-full border border-transparent rounded-lg p-3 outline-none transition-all placeholder:text-slate-800 text-[10px]",
                        isDarkMode ? "bg-slate-900/50 text-slate-500 focus:border-blue-500" : "bg-slate-50 text-slate-400 focus:border-blue-500"
                      )} 
                      value={p.note} 
                      placeholder="Operational Notes..."
                      onChange={(e) => {
                        const newList = [...perfData.prospectList];
                        newList[i].note = e.target.value;
                        setPerfData(prev => ({ ...prev, prospectList: newList }));
                      }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recruit Pipeline Bento Section */}
      <div className={cn(
        "bento-card p-8 group transition-colors duration-300",
        isDarkMode ? "bg-slate-900/40 border-emerald-500/10" : "bg-white border-slate-200"
      )}>
        <input 
          type="file" 
          accept=".csv,.txt" 
          className="hidden" 
          ref={recruitInputRef} 
          onChange={(e) => handleImport('recruit', e)} 
        />
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><UserPlus size={18} /></div>
             <h3 className={cn(
               "text-xs font-bold uppercase tracking-[0.2em]",
               isDarkMode ? "text-slate-400" : "text-slate-500"
             )}>Recruitment Pipeline · Future Force</h3>
           </div>
           <div className="flex items-center gap-4">
             <button 
                onClick={() => recruitInputRef.current?.click()}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    isDarkMode 
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
             >
                <Upload size={12} /> 导入名单 (Import)
             </button>
             <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Pipeline nodes: {perfData.recruitList.filter(r => r.name).length} / 25</div>
           </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className={cn(
                "uppercase tracking-tighter border-b",
                isDarkMode ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-200"
              )}>
                <th className="p-4 font-bold"># ID</th>
                <th className="p-4 font-bold">Talent Name</th>
                <th className="p-4 font-bold">Current Carrier</th>
                <th className="p-4 font-bold">P-Score</th>
                <th className="p-4 font-bold">Lifecycle Status</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800/30" : "divide-slate-100")}>
              {perfData.recruitList.map((r, i) => (
                <tr key={i} className={cn(
                  "transition-colors group",
                  isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-emerald-500/[0.02]"
                )}>
                  <td className="p-4 font-mono text-slate-700">{String(i + 1).padStart(2, '0')}</td>
                  <td className="p-2">
                    <input 
                      className={cn(
                        "w-full border border-transparent rounded-lg p-3 outline-none transition-all placeholder:text-slate-800",
                        isDarkMode ? "bg-slate-900/50 text-white focus:border-emerald-500" : "bg-slate-50 text-slate-900 focus:border-emerald-500"
                      )} 
                      value={r.name} 
                      placeholder="Initialize Profile..."
                      onChange={(e) => {
                        const newList = [...perfData.recruitList];
                        newList[i].name = e.target.value;
                        setPerfData(prev => ({ ...prev, recruitList: newList }));
                      }} />
                  </td>
                  <td className="p-2">
                    <input 
                      className={cn(
                        "w-full border border-transparent rounded-lg p-3 outline-none transition-all placeholder:text-slate-800 text-[10px]",
                        isDarkMode ? "bg-slate-900/50 text-slate-400 focus:border-emerald-500" : "bg-slate-50 text-slate-600 focus:border-emerald-500"
                      )} 
                      value={r.job} 
                      placeholder="Occupation..."
                      onChange={(e) => {
                        const newList = [...perfData.recruitList];
                        newList[i].job = e.target.value;
                        setPerfData(prev => ({ ...prev, recruitList: newList }));
                      }} />
                  </td>
                   <td className="p-2 text-center">
                    <input 
                      className={cn(
                        "w-16 border border-transparent rounded-lg p-3 outline-none transition-all text-center font-mono",
                        isDarkMode ? "bg-slate-900/50 text-emerald-400 focus:border-emerald-500" : "bg-slate-50 text-emerald-600 focus:border-emerald-500"
                      )} 
                      value={r.interest} 
                      placeholder="0"
                      onChange={(e) => {
                        const newList = [...perfData.recruitList];
                        newList[i].interest = e.target.value;
                        setPerfData(prev => ({ ...prev, recruitList: newList }));
                      }} />
                  </td>
                   <td className="p-2">
                    <input 
                      className={cn(
                        "w-full border border-transparent rounded-lg p-3 outline-none transition-all placeholder:text-slate-800 text-[10px]",
                        isDarkMode ? "bg-slate-900/50 text-slate-500 focus:border-emerald-500" : "bg-slate-50 text-slate-400 focus:border-emerald-500"
                      )} 
                      value={r.followup} 
                      placeholder="Lifecycle Track..."
                      onChange={(e) => {
                        const newList = [...perfData.recruitList];
                        newList[i].followup = e.target.value;
                        setPerfData(prev => ({ ...prev, recruitList: newList }));
                      }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
