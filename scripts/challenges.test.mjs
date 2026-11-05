import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import initSqlJs from "sql.js";
import ts from "typescript";

async function loadDataModule(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const js = ts.transpile(source, { module: ts.ModuleKind.ES2022 });
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}

test("assignment challenges are first, unique, and return the requested results", async () => {
  const [{ CHALLENGES }, { TASKS_SQL }, SQL] = await Promise.all([
    loadDataModule("../src/data/challenges.ts"),
    loadDataModule("../src/data/tasks.ts"),
    initSqlJs(),
  ]);
  const ids = [
    "tasks-7", "tasks-19", "tasks-20", "tasks-21", "tasks-22",
    "tasks-23", "tasks-24", "tasks-16", "tasks-25", "tasks-26",
  ];
  assert.deepEqual(CHALLENGES.slice(0, 10).map((c) => c.id), ids);
  assert.equal(new Set(CHALLENGES.map((c) => c.id)).size, CHALLENGES.length);
  assert.equal(new Set(CHALLENGES.map((c) => c.title)).size, CHALLENGES.length);
  const challenges = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));
  const db = new SQL.Database();
  try {
    db.run(TASKS_SQL);
    const rows = (sql) => db.exec(sql)[0]?.values ?? [];
    const unordered = (values) => values.map((row) => JSON.stringify(row)).sort();
    const check = (id, expected, ordered = false) => {
      const actual = rows(challenges[id].solution);
      assert.deepEqual(ordered ? actual : unordered(actual), ordered ? expected : unordered(expected), id);
    };
    const verify = () => {
      const tasks = rows("SELECT * FROM task");
      const statuses = rows("SELECT id, name FROM status");
      const names = new Map(statuses);
      const counts = statuses.map(([id, name]) => [name, tasks.filter((task) => task[6] === id).length]);
      const newest = [...tasks].sort((a, b) => b[3].localeCompare(a[3]));
      check("tasks-7", [[tasks.length]]);
      check("tasks-19", [[tasks.filter((task) => task[5] === null || Number.isNaN(Date.parse(task[5]))).length]]);
      check("tasks-20", tasks.filter((task) => names.get(task[6]) === "Done"));
      check("tasks-21", tasks.filter((task) => names.get(task[6]) !== "Done"));
      check("tasks-22", newest, true);
      check("tasks-23", [newest[0]]);
      check("tasks-24", tasks.filter((task) => /database/i.test(task[1]) || /database/i.test(task[2] ?? "")).map((task) => [task[1], task[5]]));
      check("tasks-16", tasks.map((task) => [task[1], names.get(task[6])]));
      check("tasks-25", counts);
      check("tasks-26", counts.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => [name]), true);
    };
    assert.equal(rows("SELECT COUNT(*) FROM task")[0][0], 35);
    assert.equal(rows("SELECT COUNT(*) FROM task WHERE due_date IS NULL")[0][0], 8);
    verify();
    db.run("UPDATE task SET due_date = 'not-a-date', description = 'DATABASE migration' WHERE id = 2");
    db.run("INSERT INTO status (id, name) VALUES (4, 'Waiting')");
    verify();
  } finally {
    db.close();
  }
});
