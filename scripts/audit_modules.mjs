import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const jsDir = path.join(rootDir, "frontend", "js");

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(file));
    else if (file.endsWith(".js") && !file.endsWith("app.js")) results.push(file);
  });
  return results;
}

const jsFiles = getFiles(jsDir);
let errors = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  // Simple regex parser for imports
  const lines = content.split("\n");
  lines.forEach((line, lineNo) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("import ")) return;
    const match = trimmed.match(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/);
    if (!match) return;
    const namedPart = match[1];
    const defaultPart = match[2];
    const importPath = match[3];

    const resolved = path.resolve(path.dirname(file), importPath);
    if (!fs.existsSync(resolved)) {
      errors.push({ file: path.relative(rootDir, file), lineNo: lineNo + 1, error: `Missing file: ${importPath}` });
      return;
    }

    const targetContent = fs.readFileSync(resolved, "utf8");
    if (namedPart) {
      const names = namedPart.split(",").map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      for (const name of names) {
        const regex1 = new RegExp(`export\\s+(const|let|var|function|class)\\s+${name}\\b`);
        const regex2 = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`);
        if (!regex1.test(targetContent) && !regex2.test(targetContent)) {
          errors.push({
            file: path.relative(rootDir, file),
            lineNo: lineNo + 1,
            error: `Export "${name}" NOT found in ${importPath}`
          });
        }
      }
    }
    if (defaultPart) {
      if (!targetContent.includes("export default")) {
        errors.push({
          file: path.relative(rootDir, file),
          lineNo: lineNo + 1,
          error: `Default export "${defaultPart}" NOT found in ${importPath}`
        });
      }
    }
  });
});

console.log("Module Audit Results:");
if (errors.length === 0) {
  console.log("ALL IMPORTS VALID! No missing exports or files found.");
} else {
  console.log(`Found ${errors.length} issue(s):`);
  errors.forEach(e => console.log(`  - [${e.file}:${e.lineNo}] ${e.error}`));
}
