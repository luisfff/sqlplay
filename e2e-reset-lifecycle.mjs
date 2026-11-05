import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import assert from "node:assert/strict";

const server = spawn("node", ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4656", "--strictPort"], {
  stdio: "ignore",
});
let browser;
try {
  await sleep(1500);
  browser = await chromium.launch();
  const page = await browser.newPage();
  // Instrument the existing engine in the development build, including StrictMode startup.
  await page.route("**/src/engine/db.ts", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const live = new Set();
window.handles = {created: 0, closed: 0, live, confirmations: 0, accept: true, fail: false, delay: 200};
for (const method of ["create", "open"]) {
  const original = InMemoryDatabase[method];
  InMemoryDatabase[method] = async function(...args) {
    await new Promise(resolve => setTimeout(resolve, window.handles.delay));
    const db = await original.apply(this, args);
    live.add(db);
    window.handles.created++;
    return db;
  };
}
const close = InMemoryDatabase.prototype.reset;
InMemoryDatabase.prototype.reset = function() {
  if (!live.delete(this)) throw new Error("Database closed twice or before allocation");
  window.handles.closed++;
  return close.call(this);
};
const run = InMemoryDatabase.prototype.run;
InMemoryDatabase.prototype.run = function(sql) {
  return run.call(this, window.handles.fail && sql.includes("PRAGMA foreign_keys = ON;")
    ? sql + "\\nINVALID SEED SQL;" : sql);
};
window.confirm = () => { window.handles.confirmations++; return window.handles.accept; };
` });
  });
  const ready = () => page.waitForFunction(() => {
    const picker = document.querySelector(".controls select");
    return picker && !picker.disabled && window.handles.live.size === 1;
  });
  const balanced = async () => {
    assert.deepEqual(await page.evaluate(() => ({
      live: window.handles.live.size,
      balance: window.handles.created - window.handles.closed,
    })), { live: 1, balance: 1 });
  };
  await page.goto("http://127.0.0.1:4656", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".controls select");
  assert.equal(await page.locator(".controls select").isDisabled(), true);
  await ready();
  await balanced();
  assert.equal(await page.locator(".controls select").inputValue(), "tasks");
  // StrictMode's superseded initialization must have been disposed.
  assert.equal(await page.evaluate(() => window.handles.closed), 1);
  await page.evaluate(() => { window.handles.delay = 0; });
  for (let i = 0; i < 15; i++) {
    await page.getByRole("button", { name: "Reset to Tasks database", exact: true }).click();
    await ready();
    await balanced();
  }
  await page.evaluate(() => { window.handles.fail = true; });
  await page.getByRole("button", { name: "Reset to Tasks database", exact: true }).click();
  await ready();
  await balanced();
  assert.match(await page.getByRole("status").innerText(), /Failed to load dataset/);
  await page.getByRole("button", { name: /Run/ }).first().click();
  assert.equal(await page.locator(".results tbody tr").count(), 12);

  await page.evaluate(() => {
    window.handles.fail = false;
    window.handles.delay = 200;
    window.handles.confirmations = 0;
  });
  await page.getByRole("button", { name: "Reset to Tasks database", exact: true }).click();
  for (const name of ["Reset current dataset", "Reset to Tasks database"]) {
    assert.equal(await page.getByRole("button", { name, exact: true }).isDisabled(), true);
  }
  assert.equal(await page.getByRole("button", { name: /Run/ }).first().isDisabled(), true);
  assert.equal(await page.locator(".controls select").isDisabled(), true);
  assert.equal(await page.evaluate(() => document.querySelector(".workspace").inert), true);
  // Even synthetic duplicate events cannot bypass the synchronous loading guard.
  await page.evaluate(() => {
    for (const button of document.querySelectorAll(".controls button")) {
      if (button.textContent.includes("Reset"))
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  await ready();
  await balanced();
  assert.equal(await page.evaluate(() => window.handles.confirmations), 1);
  assert.equal(await page.evaluate(() => window.handles.created), 19);
  console.log("  PASS StrictMode startup, repeated/failed reset handle disposal and pending interaction guards");

  const challengeReady = () => page.waitForFunction(() =>
    !document.querySelector(".workspace")?.inert && !document.querySelector(".controls button")?.disabled
  );
  const setSql = async (sql) => {
    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.insertText(sql);
  };
  await page.evaluate(() => { window.handles.delay = 0; });
  await page.getByRole("button", { name: "Challenges", exact: true }).click();
  await challengeReady();
  await page.getByRole("button", { name: "Show solution" }).click();
  await page.getByRole("button", { name: /Check answer/ }).click();
  await page.waitForSelector(".challenge-feedback.pass");
  await page.locator(".challenge-group li").filter({ hasText: "Names and phones" }).click();
  await challengeReady();
  await page.getByRole("button", { name: "Show solution" }).click();
  await page.getByRole("button", { name: /Check answer/ }).click();
  await page.waitForSelector(".challenge-feedback.pass");
  assert.match(await page.locator(".challenge-progress").innerText(), /Homework solved 1\//);
  assert.match(await page.locator(".challenge-group-title").last().innerText(), /Completed 1\//i);
  await setSql("CREATE TABLE reset_test (id INTEGER);");
  await page.getByRole("button", { name: /Run/ }).first().click();
  const before = await page.evaluate(() => ({
    solved: localStorage.getItem("sqlplay.solved.v1"),
    history: localStorage.getItem("sqlplay.history.v1"),
    datasets: localStorage.getItem("sqlplay.userDatasets.v1"),
  }));
  const resetChallenges = page.getByRole("button", { name: "Reset challenges", exact: true });

  await page.evaluate(() => { window.handles.accept = false; });
  await resetChallenges.click();
  assert.equal(await page.evaluate(() => localStorage.getItem("sqlplay.solved.v1")), before.solved);
  assert.match(await page.locator(".cm-content").innerText(), /CREATE TABLE reset_test/);

  await page.evaluate(() => { window.handles.accept = true; window.handles.fail = true; });
  await resetChallenges.click();
  await challengeReady();
  assert.match(await page.getByRole("status").innerText(), /Failed to load dataset/);
  assert.equal(await page.evaluate(() => localStorage.getItem("sqlplay.solved.v1")), before.solved);

  await page.evaluate(() => {
    window.handles.fail = false;
    window.originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
      if (key === "sqlplay.solved.v1") throw new Error("storage unavailable");
      return window.originalRemoveItem.call(this, key);
    };
  });
  await resetChallenges.click();
  await challengeReady();
  assert.match(await page.getByRole("status").innerText(), /Could not clear challenge progress/);
  assert.equal(await page.evaluate(() => localStorage.getItem("sqlplay.solved.v1")), before.solved);
  await setSql("SELECT name FROM sqlite_master WHERE name = 'reset_test';");
  await page.getByRole("button", { name: /Run/ }).first().click();
  assert.equal(await page.locator(".results tbody tr").count(), 1);
  await page.evaluate(() => { Storage.prototype.removeItem = window.originalRemoveItem; });

  const historyBeforeReset = await page.evaluate(() => localStorage.getItem("sqlplay.history.v1"));
  await resetChallenges.click();
  await challengeReady();
  await balanced();
  assert.match(await page.getByRole("status").innerText(), /Challenge progress and current database reset/);
  assert.match(await page.locator(".challenge-progress").innerText(), /Homework solved 0\//);
  assert.match(await page.locator(".challenge-group-title").last().innerText(), /Completed 0\//i);
  assert.equal(await page.getByRole("button", { name: /Check answer/ }).isEnabled(), true);
  assert.match(await page.locator(".cm-content").innerText(), /Write your query below/);
  assert.deepEqual(await page.evaluate(() => ({
    solved: localStorage.getItem("sqlplay.solved.v1"),
    history: localStorage.getItem("sqlplay.history.v1"),
    datasets: localStorage.getItem("sqlplay.userDatasets.v1"),
  })), { solved: null, history: historyBeforeReset, datasets: before.datasets });
  await setSql("SELECT name FROM sqlite_master WHERE name = 'reset_test';");
  await page.getByRole("button", { name: /Run/ }).first().click();
  assert.equal(await page.locator(".results tbody tr").count(), 0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await ready();
  await page.getByRole("button", { name: "Challenges", exact: true }).click();
  await challengeReady();
  assert.match(await page.locator(".challenge-progress").innerText(), /Homework solved 0\//);
  assert.match(await page.locator(".challenge-group-title").last().innerText(), /Completed 0\//i);
  console.log("  PASS challenge reset, cancellation, failure preservation and persistence");
} finally {
  await browser?.close();
  server.kill();
}
