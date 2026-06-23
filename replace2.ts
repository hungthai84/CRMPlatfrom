import fs from 'fs';

let dashboardPath = 'src/pages/Dashboard.tsx';
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf-8');
  content = content.replace(
    '<div className="w-full h-full p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar relative">',
    '<div className="w-full h-full p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar relative bg-slate-50 dark:bg-slate-900/40">'
  );
  fs.writeFileSync(dashboardPath, content);
  console.log(`Updated ${dashboardPath}`);
}
