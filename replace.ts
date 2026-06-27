import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/text-\[#2F69FF\]/g, 'text-blue-600');
  content = content.replace(/bg-\[#2F69FF\]/g, 'bg-blue-600');
  content = content.replace(/border-\[#2F69FF\]/g, 'border-blue-600');
  content = content.replace(/shadow-\[#2F69FF\]/g, 'shadow-blue-600');
  content = content.replace(/hover:bg-\[#1a55eb\]/g, 'hover:bg-blue-700');
  content = content.replace(/hover:text-\[#2F69FF\]/g, 'hover:text-blue-600');
  content = content.replace(/#2F69FF/g, '#2563eb');
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src');
