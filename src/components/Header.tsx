import React from 'react';
import { DTIcon } from './DTIcon';
import { ThemeConfig } from '../types';
import { Calendar, Zap, Download, Upload, RefreshCw, Send, FileText, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  theme: ThemeConfig;
  onOpenCalendar: () => void;
  onQuickAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onSyncIcal: () => void;
  onExportAll: () => void;
  onSyncGoogle: () => void;
  onExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onOpenCalendar,
  onQuickAdd,
  onExport,
  onImport,
  onSyncIcal,
  onExportAll,
  onSyncGoogle,
  onExportReport
}) => {
  const currentDate = new Date();
  
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4 mt-4">
      <div>
        <div className="flex items-center gap-3">
          <DTIcon theme={theme} size={32} />
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            David Tung <span className="text-accent text-[10px] font-mono align-top ml-2 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 uppercase">2026 Elite</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-1 ml-11">Personal Intelligence & Performance Dashboard</p>
      </div>
      
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-100">{format(currentDate, 'EEEE, MMMM dd')}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{format(currentDate, 'hh:mm a')} · Global Performance</p>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={onSyncIcal}
             className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/20 group"
             title="一键同步 Apple 日历 (Sync Apple Calendar)"
           >
              <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
           </button>
           <button 
             onClick={onExportReport}
             className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-900/20 group"
             title="导出周报 (Export Weekly Report)"
           >
              <FileText size={20} className="group-hover:scale-110 transition-transform" />
           </button>
           <button 
             onClick={onQuickAdd}
             className="w-10 h-10 rounded-2xl bg-accent/20 text-accent flex items-center justify-center border border-accent/20 hover:bg-accent hover:text-white transition-all shadow-lg shadow-accent/20 group"
             title="快速添加"
           >
              <Zap size={20} className="group-hover:scale-110 transition-transform" />
           </button>
           <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-bold border border-slate-700 text-slate-100 text-sm">
             DT
           </div>
        </div>
      </div>
    </header>
  );
};
