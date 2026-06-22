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

const clientDistPath = path.resolve(
  path.dirname(path.dirname(__dirname)),
  "client",
  "dist",
);
app.all("/*", express.static(clientDistPath));

app.listen(port, () => {
  console.log(`${APP_NAME} server listening on http://localhost:${port}`);
  openUrl(`http://localhost:${port}`);
});
