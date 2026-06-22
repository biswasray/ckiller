#!/usr/bin/env node
import express from "express";
import {
  APP_NAME,
  APP_VERSION,
  DEFAULT_SERVER_PORT,
  greet,
} from "@ckiller/universe";

const app = express();
const port = Number(process.env.PORT) || DEFAULT_SERVER_PORT;

app.get("/", (_req, res) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    message: greet("World"),
  });
});

app.listen(port, () => {
  console.log(`${APP_NAME} server listening on http://localhost:${port}`);
});
