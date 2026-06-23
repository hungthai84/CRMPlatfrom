import fs from 'fs';

const replacements = [
  {
    file: 'src/pages/Customers.tsx',
    from: '<div className="flex flex-col h-full bg-white relative p-6 md:p-8 no-scrollbar">',
    to: '<div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 relative p-4 lg:p-6 overflow-y-auto w-full no-scrollbar space-y-6">'
  },
  {
    file: 'src/pages/Journey.tsx',
    from: '<div className="flex flex-col h-full bg-slate-50 relative p-6 md:p-8 overflow-y-auto no-scrollbar">',
    to: '<div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 relative p-4 lg:p-6 overflow-y-auto no-scrollbar w-full space-y-6">'
  },
  {
    file: 'src/pages/Settings.tsx',
    from: '<div id="settings-module-container" className="p-1 space-y-6 flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 rounded-2xl overflow-hidden pb-4">',
    to: '<div id="settings-module-container" className="p-4 lg:p-6 space-y-6 flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 overflow-y-auto no-scrollbar w-full">'
  },
  {
    file: 'src/pages/SalesPipeline.tsx',
    from: '<div className="max-w-full h-full flex p-6 md:p-8 overflow-hidden relative">',
    to: '<div className="max-w-full h-full flex p-4 lg:p-6 overflow-hidden relative w-full gap-5 bg-slate-50 dark:bg-slate-900/40">'
  },
  {
    file: 'src/pages/Tasks.tsx',
    from: '<div className="p-8 h-full bg-slate-50 dark:bg-slate-900/40 flex flex-col font-sans">',
    to: '<div className="p-4 lg:p-6 h-full bg-slate-50 dark:bg-slate-900/40 flex flex-col font-sans overflow-y-auto no-scrollbar w-full space-y-6">'
  },
  {
    file: 'src/pages/Leads.tsx',
    from: '<div className="flex flex-col h-full gap-5 font-sans relative pr-1.5" id="leads-module-container">',
    to: '<div className="flex flex-col h-full gap-5 font-sans relative p-4 lg:p-6 overflow-y-auto no-scrollbar w-full" id="leads-module-container">'
  },
  {
    file: 'src/pages/Surveys.tsx',
    from: '<div className="flex flex-col h-full gap-5 font-sans relative pr-1.5" id="surveys-module-container">',
    to: '<div className="flex flex-col h-full gap-5 font-sans relative p-4 lg:p-6 overflow-y-auto no-scrollbar w-full" id="surveys-module-container">'
  },
  {
    file: 'src/pages/Omnichannel.tsx',
    from: '<div id="omnichannel-container" className="flex flex-col lg:flex-row h-full w-full gap-5">',
    to: '<div id="omnichannel-container" className="flex flex-col lg:flex-row h-full w-full gap-5 p-4 lg:p-6 bg-slate-50 dark:bg-slate-900/40">'
  },
  {
    file: 'src/pages/SupportModule.tsx',
    from: '<div className="flex flex-col h-full bg-slate-50/50">',
    to: '<div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/40 p-4 lg:p-6 space-y-6 overflow-y-auto no-scrollbar w-full">'
  },
  {
    file: 'src/pages/MarketingAI.tsx',
    from: '<div className="flex flex-col h-full bg-slate-50/50">',
    to: '<div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/40 p-4 lg:p-6 space-y-6 overflow-y-auto no-scrollbar w-full">'
  },
  {
    file: 'src/pages/ArchitectureDocs.tsx',
    from: '<div className="w-full h-full p-6 md:p-12 space-y-8 flex-1 overflow-y-auto">',
    to: '<div className="w-full h-full p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/40">'
  },
  {
    file: 'src/pages/KnowledgeBase.tsx',
    from: '<div className="flex h-full bg-[#f8fafc] overflow-hidden p-6 md:p-8">',
    to: '<div className="flex h-full bg-slate-50 dark:bg-slate-900/40 overflow-hidden p-4 lg:p-6 gap-5">'
  },
  {
    file: 'src/pages/Documents.tsx',
    from: '<div className="p-6 md:p-8 h-full bg-slate-50 flex flex-col">',
    to: '<div className="p-4 lg:p-6 h-full bg-slate-50 dark:bg-slate-900/40 flex flex-col overflow-y-auto w-full space-y-6">'
  },
  {
    file: 'src/pages/Users.tsx',
    from: '<div className="p-6 md:p-8 h-full bg-white flex flex-col">',
    to: '<div className="p-4 lg:p-6 h-full bg-slate-50 dark:bg-slate-900/40 flex flex-col overflow-y-auto w-full space-y-6">'
  },
  {
    file: 'src/pages/Loyalty.tsx',
    from: '<div className="p-6 md:p-8 h-full flex flex-col items-stretch max-w-7xl mx-auto w-full no-scrollbar">',
    to: '<div className="p-4 lg:p-6 h-full flex flex-col items-stretch max-w-7xl mx-auto w-full no-scrollbar overflow-y-auto space-y-6">'
  }
];

replacements.forEach(r => {
  if (fs.existsSync(r.file)) {
    let content = fs.readFileSync(r.file, 'utf-8');
    content = content.replace(r.from, r.to);
    fs.writeFileSync(r.file, content);
    console.log(`Updated ${r.file}`);
  }
});

// Settings specifically has some extra layout problems with an inner wrapper
let settingsPath = 'src/pages/Settings.tsx';
if (fs.existsSync(settingsPath)) {
  let content = fs.readFileSync(settingsPath, 'utf-8');
  content = content.replace('<div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mx-4 mt-4">', '<div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">');
  fs.writeFileSync(settingsPath, content);
}

