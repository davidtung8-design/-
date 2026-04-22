import React, { useRef, useState } from 'react';
import { PerfData } from '../types';
import { UserPlus, Target, Upload, Search, Plus, Trash2, Star, Database, Filter, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ListPageProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  isDarkMode: boolean;
}

export const ListPage: React.FC<ListPageProps> = ({ perfData, setPerfData, isDarkMode }) => {
  const prospectInputRef = useRef<HTMLInputElement>(null);
  const recruitInputRef = useRef<HTMLInputElement>(null);
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prospect' | 'recruit'>('prospect');
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);

  // --- Handlers ---
  const handleImportVCF = (type: 'prospect' | 'recruit', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // Basic vCard parser
      const contacts: { name: string, tel: string }[] = [];
      let currentContact: { name?: string, tel?: string } = {};
      
      const lines = content.split(/\r?\n/);
      lines.forEach(line => {
        if (line.startsWith('BEGIN:VCARD')) currentContact = {};
        if (line.startsWith('FN:')) currentContact.name = line.substring(3).trim();
        if (line.startsWith('TEL')) {
          const parts = line.split(':');
          if (parts.length > 1) currentContact.tel = parts[1].trim();
        }
        if (line.startsWith('END:VCARD')) {
          if (currentContact.name) {
            contacts.push({ name: currentContact.name, tel: currentContact.tel || '' });
          }
        }
      });

      if (contacts.length === 0) {
        alert('未在文件中检测到有效的联系人信息。');
        return;
      }

      const newEntries = contacts.map(c => ({
        name: c.name,
        job: '',
        isPinned: false,
        ...(type === 'prospect' 
          ? { plan: '', note: c.tel } 
          : { interest: '0', followup: c.tel })
      }));

      setPerfData(prev => ({
        ...prev,
        [type === 'prospect' ? 'prospectList' : 'recruitList']: [
          ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'],
          ...newEntries
        ]
      }));
      alert(`已成功导入 ${contacts.length} 位联系人到 ${type === 'prospect' ? '准客户' : '准增员'} 列表。`);
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportContacts = async (type: 'prospect' | 'recruit') => {
    const isContactPickerSupported = 'contacts' in navigator && 'select' in (navigator as any).contacts;
    
    if (!isContactPickerSupported) {
      const confirmVCF = confirm('您的浏览器不支持直接读取通讯录（通常是由于 iFrame 限制或浏览器版本过低）。\n\n您可以选择导入 .vCard (.vcf) 文件，这是从 iPhone 搬运联系人最稳妥的方法：\n1. 在手机通讯录选好人 -> 共享联系人 -> 存储到“文件”\n2. 在这里选择刚才存储的文件。\n\n是否现在选择 .vcf 文件进行导入？');
      if (confirmVCF) {
        vcfInputRef.current?.click();
      }
      return;
    }

    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);
      
      if (contacts && contacts.length > 0) {
        const newEntries = contacts.map((c: any) => {
          let name = 'Unknown';
          if (typeof c.name === 'string') name = c.name;
          else if (Array.isArray(c.name) && c.name[0]) name = c.name[0];
          
          let tel = '';
          if (typeof c.tel === 'string') tel = c.tel;
          else if (Array.isArray(c.tel) && c.tel[0]) tel = c.tel[0];

          return {
            name,
            job: '',
            isPinned: false,
            ...(type === 'prospect' 
              ? { plan: '', note: tel } 
              : { interest: '0', followup: tel })
          };
        });

        setPerfData(prev => ({
          ...prev,
          [type === 'prospect' ? 'prospectList' : 'recruitList']: [
            ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'],
            ...newEntries
          ]
        }));
        alert(`已同步 ${newEntries.length} 位联系人。`);
      }
    } catch (err) { 
      console.error('Contact select error:', err);
      // Optional: don't alert on user cancel
    }
  };
  const currentList = activeTab === 'prospect' ? perfData.prospectList : perfData.recruitList;
  
  const pinnedEntries = currentList.filter(x => x.isPinned && x.name);
  const unpinnedEntries = currentList.filter(x => !x.isPinned && x.name);

  // Combine for search but keep pinned status
  const filteredEntries = [...pinnedEntries, ...unpinnedEntries].filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === 'prospect' 
        ? (item as any).note.toLowerCase().includes(searchTerm.toLowerCase()) 
        : (item as any).followup.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = !showOnlyPinned || item.isPinned;
    
    return matchesSearch && matchesFilter;
  });

  // --- Handlers ---
  const handleImportCSV = (type: 'prospect' | 'recruit', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const rows = content.split('\n').filter(row => row.trim());
      const importedData = rows.map(row => row.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, '')));

      const newEntries = importedData.map(item => ({
        name: item[0] || '',
        job: item[1] || '',
        isPinned: false,
        ...(type === 'prospect' 
          ? { plan: item[2] || '', note: item[3] || '' } 
          : { interest: item[2] || '0', followup: item[3] || '' })
      })).filter(x => x.name);

      setPerfData(prev => ({
        ...prev,
        [type === 'prospect' ? 'prospectList' : 'recruitList']: [
          ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'].filter(x => x.name),
          ...newEntries
        ]
      }));
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const addNew = (type: 'prospect' | 'recruit') => {
    const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
    const newItem = { 
      name: '', 
      job: '', 
      isPinned: true, // Auto-pin new manual entries
      ...(type === 'prospect' ? { plan: '', note: '' } : { interest: '0', followup: '' }) 
    };
    setPerfData(prev => ({
      ...prev,
      [listKey]: [newItem, ...prev[listKey]]
    }));
  };

  const togglePin = (type: 'prospect' | 'recruit', indexInOriginal: number) => {
    setPerfData(prev => {
      const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
      const newList = [...prev[listKey]];
      newList[indexInOriginal] = { ...newList[indexInOriginal], isPinned: !newList[indexInOriginal].isPinned };
      return { ...prev, [listKey]: newList };
    });
  };

  const removeEntry = (type: 'prospect' | 'recruit', indexInOriginal: number) => {
    if (!confirm('Warning: This will permanently delete this node from the database.')) return;
    setPerfData(prev => {
      const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
      const newList = [...prev[listKey]];
      newList.splice(indexInOriginal, 1);
      return { ...prev, [listKey]: newList };
    });
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-24">
      {/* Search & Mode Controller */}
      <div className={cn(
        "bento-card p-6 sticky top-0 z-40 backdrop-blur-xl border-b shadow-2xl space-y-4",
        isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/95 border-slate-200"
      )}>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex bg-slate-800/10 p-1.5 rounded-[1.5rem] border border-slate-800/10 shrink-0">
            <button 
              onClick={() => setActiveTab('prospect')}
              className={cn(
                "px-8 py-3 rounded-[1.2rem] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'prospect' 
                  ? "bg-blue-500 text-white shadow-xl" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Target size={14} /> Prospects
            </button>
            <button 
              onClick={() => setActiveTab('recruit')}
              className={cn(
                "px-8 py-3 rounded-[1.2rem] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'recruit' 
                  ? "bg-emerald-500 text-white shadow-xl" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <UserPlus size={14} /> Recruits
            </button>
          </div>

          <div className="flex-1 w-full relative">
            <input 
              type="text"
              placeholder={`Search matrix database nodes (Currently: ${currentList.filter(x => x.name).length} recorded)...`}
              className={cn(
                "w-full h-14 pl-14 pr-6 rounded-[1.5rem] border outline-none transition-all font-medium text-base",
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-white focus:border-blue-500 placeholder:text-slate-600" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 placeholder:text-slate-400"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowOnlyPinned(!showOnlyPinned)}
              className={cn(
                "h-14 px-5 rounded-[1.5rem] border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                showOnlyPinned 
                  ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/20 shadow-lg" 
                  : (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600" : "bg-white border-slate-200 text-slate-500")
              )}
            >
              <Star size={16} fill={showOnlyPinned ? "currentColor" : "none"} />
              {showOnlyPinned ? "Pinned Only" : "Show All"}
            </button>
            <button 
              onClick={() => addNew(activeTab)}
              className="h-14 px-6 bg-slate-900 text-white dark:bg-white dark:text-black rounded-[1.5rem] font-bold flex items-center gap-2 hover:opacity-80 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-xl"
            >
              <Plus size={16} /> New Node
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Focus Matrix (Pinned Section) */}
      <AnimatePresence>
        {pinnedEntries.length > 0 && !showOnlyPinned && searchTerm === '' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 px-2"
          >
            <div className="flex items-center gap-2 px-6 mb-4">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Strategic Focus Matrix (Top 20+ Focus)</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pinnedEntries.map((item, idx) => {
                const globalIdx = currentList.indexOf(item);
                return (
                  <motion.div 
                    layout
                    key={globalIdx}
                    className={cn(
                      "bento-card p-6 border-l-4 relative group transition-all hover:scale-[1.02]",
                      activeTab === 'prospect' ? "border-l-blue-500" : "border-l-emerald-500",
                      isDarkMode ? "bg-slate-900/60" : "bg-white shadow-xl shadow-slate-200/50"
                    )}
                  >
                    <button 
                      onClick={() => togglePin(activeTab, globalIdx)}
                      className="absolute top-4 right-4 text-amber-500 hover:scale-125 transition-transform"
                    >
                      <Star size={16} fill="currentColor" />
                    </button>
                    <div className="space-y-4">
                      <div>
                        <input 
                          className="bg-transparent border-none outline-none font-bold text-lg text-white w-full"
                          value={item.name}
                          onChange={(e) => {
                            const newList = [...currentList];
                            newList[globalIdx].name = e.target.value;
                            setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                          }}
                        />
                        <input 
                          className="bg-transparent border-none outline-none text-[10px] text-slate-500 uppercase tracking-widest block"
                          value={item.job}
                          placeholder="Industry / Role"
                          onChange={(e) => {
                            const newList = [...currentList];
                            newList[globalIdx].job = e.target.value;
                            setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                          }}
                        />
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl text-[11px] font-mono leading-snug",
                        isDarkMode ? "bg-slate-950/50 text-slate-400" : "bg-slate-50 text-slate-600"
                      )}>
                        {activeTab === 'prospect' ? (item as any).plan : `Score: ${(item as any).interest}/100`}
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-slate-500">
                        <span># Focus Node {idx + 1}</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Master Database Table */}
      <div className={cn(
        "bento-card overflow-hidden transition-all duration-500 border relative",
        isDarkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
      )}>
        <input type="file" ref={prospectInputRef} className="hidden" accept=".csv" onChange={(e) => handleImportCSV('prospect', e)} />
        <input type="file" ref={recruitInputRef} className="hidden" accept=".csv" onChange={(e) => handleImportCSV('recruit', e)} />
        <input type="file" ref={vcfInputRef} className="hidden" accept=".vcf" onChange={(e) => handleImportVCF(activeTab, e)} />

        <div className="p-8 border-b border-slate-800/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className={cn(
               "p-4 rounded-[1.5rem]",
               activeTab === 'prospect' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
             )}>
               <Database size={24} />
             </div>
             <div>
               <h2 className={cn(
                 "text-sm font-black uppercase tracking-[0.3em]",
                 isDarkMode ? "text-slate-200" : "text-slate-800"
               )}>
                 Matrix Database Master File
               </h2>
               <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-widest">
                 Index: {currentList.filter(x => x.name).length} / 2500+ Operational Capacity
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleImportContacts(activeTab)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <UserPlus size={14} /> Phone Sync
            </button>
            <button 
              onClick={() => (activeTab === 'prospect' ? prospectInputRef : recruitInputRef).current?.click()}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Upload size={14} /> Bulk CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar overflow-y-auto max-h-[70vh]">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 z-30">
              <tr className={cn(
                "uppercase tracking-tighter border-b backdrop-blur-md",
                isDarkMode ? "bg-slate-900/90 text-slate-500 border-slate-800" : "bg-slate-50/95 text-slate-400 border-slate-200"
              )}>
                <th className="p-5 font-black w-24">Focus</th>
                <th className="p-5 font-black min-w-[200px]">Node Identity</th>
                <th className="p-5 font-black min-w-[180px]">Organization / Role</th>
                <th className="p-5 font-black min-w-[200px]">{activeTab === 'prospect' ? 'Strategic Plan' : 'Talent Matrix Score'}</th>
                <th className="p-5 font-black min-w-[300px]">Lifecycle Ops Logs</th>
                <th className="p-5 font-black w-20 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800/30" : "divide-slate-100")}>
              {filteredEntries.map((item, idx) => {
                const originalIndex = currentList.indexOf(item);
                return (
                  <tr key={idx} className={cn(
                    "group transition-all",
                    isDarkMode ? "hover:bg-blue-500/[0.04]" : "hover:bg-blue-500/[0.01]"
                  )}>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => togglePin(activeTab, originalIndex)}
                        className={cn(
                          "p-2 rounded-xl border transition-all",
                          item.isPinned 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                            : "border-slate-800/10 text-slate-700 hover:border-amber-500/30 hover:text-amber-500"
                        )}
                      >
                        <Star size={16} fill={item.isPinned ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="p-3">
                      <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800 font-bold",
                          isDarkMode ? "text-white focus:bg-slate-800 focus:border-blue-500/50" : "text-slate-900 focus:bg-white focus:border-blue-500/50"
                        )}
                        value={item.name}
                        placeholder="Initialize Node..."
                        onChange={(e) => {
                          const newList = [...currentList];
                          newList[originalIndex].name = e.target.value;
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3">
                       <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800",
                          isDarkMode ? "text-slate-400 focus:bg-slate-800 focus:border-blue-500/50" : "text-slate-600 focus:bg-white focus:border-blue-500/50"
                        )}
                        value={item.job}
                        placeholder="Organization..."
                        onChange={(e) => {
                          const newList = [...currentList];
                          newList[originalIndex].job = e.target.value;
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3">
                       <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800",
                          activeTab === 'prospect' ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-emerald-400" : "text-emerald-600"),
                          "focus:bg-slate-800 focus:border-blue-500/50"
                        )}
                        value={activeTab === 'prospect' ? (item as any).plan : (item as any).interest}
                        placeholder={activeTab === 'prospect' ? "Strategic Plan..." : "0-100"}
                        onChange={(e) => {
                          const newList = [...currentList];
                          if (activeTab === 'prospect') (newList[originalIndex] as any).plan = e.target.value;
                          else (newList[originalIndex] as any).interest = e.target.value;
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3">
                       <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800 text-[10px]",
                          isDarkMode ? "text-slate-500 focus:bg-slate-800 focus:border-blue-500/50" : "text-slate-400 focus:bg-white focus:border-blue-500/50"
                        )}
                        value={activeTab === 'prospect' ? (item as any).note : (item as any).followup}
                        placeholder="Operational Logs / History Tracking..."
                        onChange={(e) => {
                          const newList = [...currentList];
                          if (activeTab === 'prospect') (newList[originalIndex] as any).note = e.target.value;
                          else (newList[originalIndex] as any).followup = e.target.value;
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => removeEntry(activeTab, originalIndex)}
                        className="p-4 text-slate-800 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                        title="Destroy Node"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEntries.length === 0 && (
            <div className="p-32 text-center text-slate-500 space-y-6">
              <div className="w-16 h-16 bg-slate-800/10 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="opacity-20" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-400">Zero Nodes Detected</p>
                <p className="text-xs uppercase tracking-widest mt-2">{searchTerm ? 'Filters returned no matches' : 'Database is currently uninitialized'}</p>
              </div>
              <button 
                onClick={() => setSearchTerm('')} 
                className="px-6 py-2 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500/10 transition-all"
              >
                Reset Matrix Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
