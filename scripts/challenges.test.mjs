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
    "tasks-23", "tasks-24",
  ];
  assert.deepEqual(CHALLENGES.slice(0, ids.length).map((c) => c.id), ids);
  assert.equal(CHALLENGES.length, 20);
  for (const id of ["tasks-15", "tasks-16", "tasks-17", "tasks-18", "tasks-25", "tasks-26"]) {
    assert.ok(!CHALLENGES.some((challenge) => challenge.id === id), id);
  }
  assert.equal(new Set(CHALLENGES.map((c) => c.id)).size, CHALLENGES.length);
  assert.equal(new Set(CHALLENGES.map((c) => c.title)).size, CHALLENGES.length);
  for (const challenge of CHALLENGES) {
    assert.doesNotMatch(challenge.hint ?? "", /\bjoin\b|\bsubquer(?:y|ies)\b/i, challenge.id);
    assert.ok(challenge.solution.trim(), challenge.id);
  }
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
      const newest = [...tasks].sort((a, b) => b[3].localeCompare(a[3]));
      check("tasks-7", [[tasks.length]]);
      check("tasks-19", [[tasks.filter((task) => task[5] === null || Number.isNaN(Date.parse(task[5]))).length]]);
      check("tasks-20", tasks.filter((task) => names.get(task[6]) === "Done"));
      check("tasks-21", tasks.filter((task) => names.get(task[6]) !== "Done"));
      check("tasks-22", newest, true);
      check("tasks-23", [newest[0]]);
      check("tasks-24", tasks.filter((task) => /database/i.test(task[1]) || /database/i.test(task[2] ?? "")).map((task) => [task[1], task[5]]));
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

test("class exercises are individual challenges with valid, meaningful solutions", async () => {
  const [{ CHALLENGES }, { CLASS_EXERCISES }, { TASKS_SQL }, SQL] = await Promise.all([
    loadDataModule("../src/data/challenges.ts"),
    loadDataModule("../src/data/classExercises.ts"),
    loadDataModule("../src/data/tasks.ts"),
    initSqlJs(),
  ]);
  assert.deepEqual(CLASS_EXERCISES.slice(0, 12).map((exercise) => exercise.id),
    Array.from({ length: 12 }, (_, index) => `class-select-${index + 1}`));
  assert.ok(CLASS_EXERCISES.every((exercise) => exercise.datasetId === "tasks"));
  assert.ok(CLASS_EXERCISES.every((exercise) => exercise.prompt && exercise.hint && exercise.solution && !exercise.hideSolution));
  assert.ok(CLASS_EXERCISES.every((exercise) => !exercise.id.includes("explore")));
  const ids = [...CHALLENGES, ...CLASS_EXERCISES].map((exercise) => exercise.id);
  assert.equal(new Set(ids).size, ids.length);
  const db = new SQL.Database();
  try {
    db.run(TASKS_SQL);
    const seed = db.export();
    const expected = [
      "SELECT name, phone FROM user",
      "SELECT * FROM user ORDER BY name",
      "SELECT name FROM user WHERE id = 10",
      "SELECT * FROM task ORDER BY created ASC LIMIT 3",
      "SELECT * FROM task WHERE description IS NULL",
      "SELECT * FROM user WHERE email LIKE '%.com'",
      "SELECT title FROM task WHERE status_id = 1",
      "SELECT * FROM task WHERE user_id = 1 AND status_id = 2",
      "SELECT * FROM task WHERE title LIKE '%database%'",
      "SELECT name FROM user WHERE phone IS NULL",
      "SELECT title, created FROM task ORDER BY created DESC LIMIT 5",
      "SELECT * FROM task WHERE status_id IN (1, 2) ORDER BY title",
    ];
    for (const [index, exercise] of CLASS_EXERCISES.entries()) {
      const exerciseDb = new SQL.Database(seed);
      try {
        const result = exerciseDb.exec(exercise.solution);
        if (index < expected.length) {
          assert.deepEqual(result, db.exec(expected[index]), exercise.id);
        } else {
          assert.ok(exercise.checkDatabaseState, exercise.id);
          assert.notDeepEqual(exerciseDb.export(), seed, `${exercise.id} must change the database`);
        }
      } finally {
        exerciseDb.close();
      }
    }
  } finally {
    db.close();
  }
});

test("challenge SQL export includes every prompt and solution as safe SQL comments", async () => {
  const [{ CHALLENGES }, { CLASS_EXERCISES }, { formatChallengeSql }] =
    await Promise.all([
      loadDataModule("../src/data/challenges.ts"),
      loadDataModule("../src/data/classExercises.ts"),
      loadDataModule("../src/lib/challengeExport.ts"),
    ]);
  const sql = formatChallengeSql([
    { title: "Homework", challenges: CHALLENGES },
    { title: "Class exercises", challenges: CLASS_EXERCISES },
  ]);
  const lines = sql.split("\n");

  assert.match(sql, /-- Homework/);
  assert.match(sql, /-- Class exercises/);
  for (const challenge of [...CHALLENGES, ...CLASS_EXERCISES]) {
    assert.ok(sql.includes(`-- ${challenge.title} (${challenge.difficulty})`));
    const promptLines = challenge.prompt
      .split(/\r?\n/)
      .map((line, index) => `-- ${index === 0 ? "Question: " : ""}${line}`);
    for (const promptLine of promptLines) {
      assert.ok(lines.includes(promptLine), challenge.id);
    }
    for (const statementLine of `Reference solution:\n${challenge.solution}`.split("\n")) {
      assert.ok(lines.includes(`-- ${statementLine}`), challenge.id);
    }
  }
  assert.ok(lines.every((line) => line === "" || line.startsWith("-- ")));
});
