import { loadPyodide } from "pyodide";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(){
  let code = "";

  // 사용자 Python 코드 읽기
  const chunks = [];
  for await (const chunk of process.stdin)
    chunks.push(chunk);
  code = chunks.join("");

  const pyodide = await loadPyodide({
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write("[에러] " + s)
  });

  // stdin 연결 (input() 지원)
  pyodide.setStdin({
    stdin() {
      const buf = Buffer.alloc(4096);
      const n = fs.readSync(0, buf, 0, buf.length);
      return buf.subarray(0, n).toString();
    }
  });

  // 한글파이썬 주입
  const hang = fs.readFileSync(path.join(__dirname, "public", "hangle.py"), "utf8");
  await pyodide.runPythonAsync(hang);

  // 실행
  try {
    await pyodide.runPythonAsync(code);
  } catch (e) {
    console.error("[실행 오류]", e.message);
  }
}

main();
