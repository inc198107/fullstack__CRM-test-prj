import type { Server } from "node:http";

import mongoose from "mongoose";

import { app } from "./app";
import { runtime } from "../infrastructure/config";

export interface StartupDependencies {
  connect(): Promise<unknown>;
  listen(port: string | number): Promise<void>;
  disconnect(): Promise<unknown>;
  log(message: string): void;
}

type StartupPhase = "connect" | "listen";

export function listenOnPort(port: string | number): Promise<void> {
  return new Promise((resolve, reject) => {
    const server: Server = app.listen(port);
    const onError = (error: Error): void => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = (): void => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
  });
}

function productionDependencies(): StartupDependencies {
  return {
    connect: () => mongoose.connect(runtime.mongoURI),
    listen: listenOnPort,
    disconnect: () => mongoose.disconnect(),
    log: (message) => console.log(message),
  };
}

export async function start(dependencies: StartupDependencies = productionDependencies()): Promise<void> {
  const port = process.env.PORT || 5000;
  let phase: StartupPhase = "connect";
  try {
    await dependencies.connect();
    dependencies.log("DB connected");
    phase = "listen";
    await dependencies.listen(port);
    dependencies.log(`listen on ${port}`);
  } catch {
    dependencies.log(`startup failure: ${phase}`);
    try {
      await dependencies.disconnect();
    } catch {
      // Disconnect failures must not replace the generic startup failure.
    }
    throw new Error("Application startup failed");
  }
}

if (require.main === module) {
  void start().catch(() => {
    process.exitCode = 1;
  });
}
