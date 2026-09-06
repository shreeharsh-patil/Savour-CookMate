import { spawn } from "child_process";

const isProduction =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.RENDER) ||
  Boolean(process.env.PORT && process.env.PORT !== "8081");

if (isProduction) {
  const child = spawn("node", ["backend/dist/main.js"], { stdio: "inherit" });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
} else {
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "npx.cmd" : "npx";
  const child = spawn(cmd, ["expo", "start", ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

