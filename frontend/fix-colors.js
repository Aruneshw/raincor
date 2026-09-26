const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('./app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Add dark mode backgrounds
  content = content.replace(/(?<!dark:)bg-slate-50/g, 'bg-slate-50 dark:bg-white/5');
  content = content.replace(/(?<!dark:)hover:bg-slate-50/g, 'hover:bg-slate-50 dark:hover:bg-white/5');
  
  // Add dark mode borders
  content = content.replace(/(?<!dark:)border-slate-100/g, 'border-slate-100 dark:border-white/10');
  content = content.replace(/(?<!dark:)border-slate-200/g, 'border-slate-200 dark:border-white/10');
  content = content.replace(/(?<!dark:)border-slate-200\/80/g, 'border-slate-200/80 dark:border-white/10');

  // Add dark mode text
  content = content.replace(/(?<!dark:)text-slate-700/g, 'text-slate-700 dark:text-slate-300');
  content = content.replace(/(?<!dark:)text-slate-600/g, 'text-slate-600 dark:text-slate-400');
  content = content.replace(/(?<!dark:)text-slate-800/g, 'text-slate-800 dark:text-slate-200');

  // bg-blue-50/50
  content = content.replace(/(?<!dark:)bg-blue-50\/50/g, 'bg-blue-50/50 dark:bg-blue-900/20');
  
  // bg-emerald-100/text-emerald-800
  content = content.replace(/(?<!dark:)bg-emerald-100/g, 'bg-emerald-100 dark:bg-emerald-900/30');
  content = content.replace(/(?<!dark:)text-emerald-800/g, 'text-emerald-800 dark:text-emerald-400');

  // bg-amber-100/text-amber-800
  content = content.replace(/(?<!dark:)bg-amber-100/g, 'bg-amber-100 dark:bg-amber-900/30');
  content = content.replace(/(?<!dark:)text-amber-800/g, 'text-amber-800 dark:text-amber-400');
  
  // bg-rose-100/text-rose-800
  content = content.replace(/(?<!dark:)bg-rose-100/g, 'bg-rose-100 dark:bg-rose-900/30');
  content = content.replace(/(?<!dark:)text-rose-800/g, 'text-rose-800 dark:text-rose-400');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
