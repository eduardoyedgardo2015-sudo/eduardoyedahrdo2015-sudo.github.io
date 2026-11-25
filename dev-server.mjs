import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

function proxy(req, res, port, targetPath) {
  const headers = { ...req.headers };

  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  delete headers["transfer-encoding"];
  delete headers["accept-encoding"];

  headers["accept-encoding"] = "identity";

  const upstream = http.request({
    hostname: "127.0.0.1",
    port,
    method: req.method,
    path: targetPath,
    headers
  }, response => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });

  upstream.on("error", error => {
    console.error("Error del emulador:", error.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ error: "Emulador no disponible" }));
  });

  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  if (
    pathname.startsWith("/identitytoolkit.googleapis.com/") ||
    pathname.startsWith("/securetoken.googleapis.com/") ||
    pathname.startsWith("/emulator/")
  ) {
    return proxy(req, res, 9099, pathname + url.search);
  }

  const functionsPrefix = "/__emulator/functions/";

  if (pathname.startsWith(functionsPrefix)) {
    const target = pathname.slice("/__emulator/functions".length);
    return proxy(req, res, 5001, target + url.search);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }

  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const parts = relative.split("/");

  if (
    parts.some(part => part.startsWith(".")) ||
    ["functions", "docs", "node_modules"].includes(parts[0])
  ) {
    res.writeHead(404);
    return res.end("Not Found");
  }

  const file = path.resolve(root, relative);

  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404);
      return res.end("Not Found");
    }

    res.writeHead(200, {
      "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": stats.size,
      "Cache-Control": "no-store"
    });

    if (req.method === "HEAD") return res.end();

    fs.createReadStream(file).pipe(res);
  });
});

server.listen(8001, "0.0.0.0", () => {
  console.log("NEXUS local test server running at http://localhost:8001");
  console.log("Authentication proxy: 9099");
  console.log("Functions proxy: 5001");
});
