const http = require("http");

const paths = [
  "/auth/login",
  "/auth/forgot-password",
  "/api/reviews",
  "/feedback/EMP-8595",
];

async function checkPath(path) {
  return new Promise((resolve) => {
    http.get("http://localhost:3000" + path, (res) => {
      console.log(`✅ [${res.statusCode}] http://localhost:3000${path}`);
      resolve(res.statusCode);
    }).on("error", (err) => {
      console.log(`❌ Error on http://localhost:3000${path}:`, err.message);
      resolve(null);
    });
  });
}

async function run() {
  console.log("🌐 Testing live endpoints on http://localhost:3000...\n");
  for (const p of paths) {
    await checkPath(p);
  }
  process.exit(0);
}

run();
