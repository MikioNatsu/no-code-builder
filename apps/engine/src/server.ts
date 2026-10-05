import { createServer } from "node:http";

// Webhook routing per bot (POST /webhook/:secret) arrives in Phase 1.

export function createEngineServer() {
  return createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404).end();
  });
}
