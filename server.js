const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const files = new Set(["index.html", "styles.css", "engine.js", "mini-games.js", "arcade-games.js", "arcade-games.css", "app.js"]);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!files.has(file)) { res.writeHead(404); res.end("Not found"); return; }
  fs.readFile(path.join(__dirname, file), (error, data) => {
    if (error) { res.writeHead(500); res.end("Unable to read file"); return; }
    res.writeHead(200, { "Content-Type": `${types[path.extname(file)]}; charset=utf-8`, "Cache-Control": "no-cache" });
    res.end(data);
  });
});
server.listen(Number(process.env.PORT) || 4173, "127.0.0.1", () => console.log(`Pocket Town: http://127.0.0.1:${server.address().port}`));
