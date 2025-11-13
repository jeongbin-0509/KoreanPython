import express from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/run", (req, res) => {
  const userCode = req.body.code ?? "";

  const proc = spawn("node", ["run.js"], {
    cwd: __dirname,
    stdio: ["pipe", "pipe", "pipe"]
  });

  let output = "";
  let error = "";

  proc.stdout.on("data", (d) => output += d.toString());
  proc.stderr.on("data", (d) => error += d.toString());

  // 코드 전달
  proc.stdin.write(userCode);
  proc.stdin.end();

  proc.on("close", () => {
    res.json({ output, error });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행: http://localhost:${PORT}`);
});
