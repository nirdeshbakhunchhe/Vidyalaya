const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /bg-white(?!\s+dark:bg-slate-\d+)/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /bg-slate-50(?!\s+dark:bg-slate-\d+(?:\/50)?)(?!\/)/g, replacement: 'bg-slate-50 dark:bg-slate-900' },
  { regex: /text-slate-900(?!\s+dark:text-white)/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /text-slate-800(?!\s+dark:text-slate-\d+)/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { regex: /text-slate-700(?!\s+dark:text-slate-\d+)/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-600(?!\s+dark:text-slate-\d+)/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { regex: /text-slate-500(?!\s+dark:text-slate-\d+)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /border-slate-200(?!\s+dark:border-slate-\d+)/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /border-slate-300(?!\s+dark:border-slate-\d+)/g, replacement: 'border-slate-300 dark:border-slate-600' },
  { regex: /hover:bg-slate-50(?!\s+dark:hover:bg-slate-\d+)/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-800' },
  { regex: /hover:bg-slate-100(?!\s+dark:hover:bg-slate-\d+)/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-800' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'client', 'src', 'pages'));
processDirectory(path.join(__dirname, 'client', 'src', 'components'));
