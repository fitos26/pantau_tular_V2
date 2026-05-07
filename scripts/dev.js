const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");

const rootDir = process.cwd();
const backendDir = path.join(rootDir, "backend");

const pythonCandidates = [
  path.join(rootDir, ".venv", "Scripts", "python.exe"),
  path.join(rootDir, ".venv", "bin", "python"),
  "python",
];

const findPythonCommand = () => {
  for (const candidate of pythonCandidates) {
    if (candidate === "python" || fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "python";
};

const childProcesses = [];

const ensurePortAvailable = (port) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} sedang dipakai. Tutup proses lama dulu, lalu jalankan ulang \`npm run dev:full\`.`));
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve());
    });

    server.listen(port);
  });

const spawnManagedProcess = (name, command, args, options = {}) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
    ...options,
  });

  childProcesses.push({ name, child });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start:`, error);
  });

  return child;
};

const shutdown = (signal = "SIGTERM") => {
  for (const { child } of childProcesses) {
    if (!child.killed) {
      try {
        child.kill(signal);
      } catch {
        // Ignore shutdown races.
      }
    }
  }
};

const terminationSignals = ["SIGINT", "SIGTERM", "SIGQUIT"];
terminationSignals.forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal);
    process.exit(0);
  });
});

const pythonCommand = findPythonCommand();

const main = async () => {
  await ensurePortAvailable(3000);
  await ensurePortAvailable(8000);

  console.log("[dev] Starting Django backend on http://localhost:8000");
  console.log("[dev] Starting Next.js frontend on http://localhost:3000");

  const backend = spawnManagedProcess(
    "backend",
    pythonCommand,
    ["manage.py", "runserver", "0.0.0.0:8000"],
    { cwd: backendDir }
  );

  const frontend = spawnManagedProcess("frontend", "node", [
    path.join(rootDir, "node_modules", "next", "dist", "bin", "next"),
    "dev",
    "-p",
    "3000",
  ]);

  let exiting = false;

  const handleExit = (name, code, signal) => {
    if (exiting) {
      return;
    }

    exiting = true;
    if (signal) {
      console.log(`[${name}] exited with signal ${signal}`);
    } else if ((code ?? 0) !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }

    shutdown();
    process.exit(code ?? 0);
  };

  backend.on("exit", (code, signal) => handleExit("backend", code, signal));
  frontend.on("exit", (code, signal) => handleExit("frontend", code, signal));
};

main().catch((error) => {
  console.error("[dev] Failed to start:", error.message);
  process.exit(1);
});
