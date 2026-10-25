import { chromium } from "playwright";
import { preview } from "vite";
import { readdir } from "node:fs/promises";
import assert from "node:assert/strict";

const assets = await readdir(new URL("./dist/assets/", import.meta.url));
assert.ok(assets.some((name) => name.endsWith(".wasm")), "SQLite WASM is emitted");

// Serve the production bundle under the Pages subpath, without deployment credentials.
const server = await preview({
  base: "/sqlplay/",
  preview: { host: "127.0.0.1", port: 0, open: false },
});
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const assetPaths = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname === "127.0.0.1") assetPaths.push(url.pathname);
  });
  const wasmResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(".wasm")
  );
  const { port } = server.httpServer.address();
  await page.goto(`http://127.0.0.1:${port}/sqlplay/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const picker = document.querySelector(".controls select");
    return picker && !picker.disabled;
  });
  const wasm = await wasmResponse;
  assert.equal(wasm.status(), 200);
  assert.match(wasm.headers()["content-type"], /application\/wasm/);
  assert.ok(new URL(wasm.url()).pathname.startsWith("/sqlplay/assets/"));

  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("SELECT 1 AS answer;");
  await page.getByRole("button", { name: /Run/ }).first().click();
  await page.waitForSelector(".results table");
  assert.deepEqual(await page.locator(".results thead th:not(.rownum)").allTextContents(), ["answer"]);
  assert.deepEqual(await page.locator(".results tbody td:not(.rownum)").allTextContents(), ["1"]);
  assert.ok(assetPaths.length > 1);
  assert.ok(assetPaths.every((path) => path.startsWith("/sqlplay/")), "Assets stay under /sqlplay/");
  assert.deepEqual(errors, []);
  console.log("PASS: /sqlplay/ initializes SQLite WASM and executes SELECT 1");
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
}
