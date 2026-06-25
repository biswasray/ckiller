#!/usr/bin/env node
import express from "express";
import path from "path";
import {
  APP_NAME,
  APP_VERSION,
  DEFAULT_SERVER_PORT,
  greet,
  openUrl,
} from "@ckiller/universe";
import skillRouter from "./routes/skill";

const app = express();
const port = Number(process.env.PORT) || DEFAULT_SERVER_PORT;

app.use(express.json());

app.get("/version", (_req, res) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    message: greet("World"),
  });
});

app.use("/skill", skillRouter);

const clientDistPath = path.resolve(
  path.dirname(path.dirname(__dirname)),
  "client",
  "dist",
);
app.all("/*", express.static(clientDistPath));

app.listen(port, () => {
  console.log(`${APP_NAME} server listening on http://localhost:${port}`);
  // 1. Find the argument that starts with 'CLIENT_PORT='
  const clientPortArg = process.argv.find((arg) =>
    arg.startsWith("CLIENT_PORT="),
  );

  // 2. Extract the value side, or fallback to a default port
  const CLIENT_PORT = clientPortArg ? clientPortArg.split("=")[1] : port;
  openUrl(`http://localhost:${CLIENT_PORT}`);
});

console.log("Server is starting...", process.argv);
