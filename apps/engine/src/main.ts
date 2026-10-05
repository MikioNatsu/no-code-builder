import { loadConfig } from "./config.js";
import { createEngineServer } from "./server.js";

const config = loadConfig();
const server = createEngineServer();

server.listen(config.port, () => {
  console.log(`Engine listening on :${config.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
