export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  /** Which sample dataset this challenge runs against. */
  datasetId: string;
  prompt: string;
  hint?: string;
  /** Reference solution used to compute the expected result set. */
  solution: string;
  /** Whether row order is part of the correct answer. */
  orderMatters: boolean;
  /** Compare the resulting database state instead of a result set. */
  checkDatabaseState?: boolean;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "tasks-7",
    title: "Count the tasks",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt: "Return the total number of rows in task as a single value.",
    hint: "COUNT(*) counts every row.",
    solution: "SELECT COUNT(*) FROM task;",
    orderMatters: false,
  },
  {
    id: "tasks-19",
    title: "Count tasks without valid due dates",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return the number of tasks with no valid due date, including NULL or unparseable dates, as a single value.",
    hint: "SQLite's datetime() returns NULL for missing or unparseable dates.",
    solution: "SELECT COUNT(*) FROM task WHERE datetime(due_date) IS NULL;",
    orderMatters: false,
  },
  {
    id: "tasks-20",
    title: "Done tasks",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt: "Return all columns of tasks marked Done.",
    hint: "Find the Done status in the status table and filter task.status_id.",
    solution: "SELECT * FROM task WHERE status_id = 3;",
    orderMatters: false,
  },
  {
    id: "tasks-21",
    title: "Tasks not done",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt: "Return all columns of tasks not marked Done.",
    hint: "Exclude the status id corresponding to Done.",
    solution: "SELECT * FROM task WHERE status_id != 3;",
    orderMatters: false,
  },
  {
    id: "tasks-22",
    title: "Tasks by creation date",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt: "Return all columns of every task, ordered by creation date with the most recent first.",
    hint: "Sort the created column in descending order.",
    solution: "SELECT * FROM task ORDER BY created DESC;",
    orderMatters: true,
  },
  {
    id: "tasks-23",
    title: "Most recently created task",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt: "Return all columns of the single most recently created task.",
    hint: "Sort by created descending and use LIMIT.",
    solution: "SELECT * FROM task ORDER BY created DESC LIMIT 1;",
    orderMatters: false,
  },
  {
    id: "tasks-24",
    title: "Tasks mentioning database",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return the title and due date of tasks whose title or description contains 'database', ignoring case. Column order: title, due_date.",
    hint: "Use LIKE with wildcards on both title and description.",
    solution: "SELECT title, due_date FROM task WHERE title LIKE '%database%' OR description LIKE '%database%';",
    orderMatters: false,
  },
  {
    id: "tasks-1",
    title: "Task titles and IDs",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return every task's id and title. Column order: id, title. Order by id ascending.",
    hint: "Select only the two requested columns from task.",
    solution: "SELECT id, title FROM task ORDER BY id;",
    orderMatters: true,
  },
  {
    id: "tasks-2",
    title: "Tasks in progress",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return the id and title of tasks with status_id 2. Column order: id, title. Order by id ascending.",
    hint: "Filter task rows with WHERE status_id = 2.",
    solution: "SELECT id, title FROM task WHERE status_id = 2 ORDER BY id;",
    orderMatters: true,
  },
  {
    id: "tasks-3",
    title: "Tasks without due dates",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return the id and title of tasks whose due_date is NULL. Column order: id, title. Order by id ascending.",
    hint: "Use IS NULL rather than = NULL.",
    solution: "SELECT id, title FROM task WHERE due_date IS NULL ORDER BY id;",
    orderMatters: true,
  },
  {
    id: "tasks-4",
    title: "Tasks alphabetically",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return each task's id and title, ordered by title alphabetically (A to Z). Column order: id, title.",
    hint: "Use ORDER BY title ASC.",
    solution: "SELECT id, title FROM task ORDER BY title ASC;",
    orderMatters: true,
  },
  {
    id: "tasks-5",
    title: "Five highest task IDs",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return the id and title of the five tasks with the highest IDs, highest ID first. Column order: id, title.",
    hint: "Sort id descending before applying LIMIT.",
    solution: "SELECT id, title FROM task ORDER BY id DESC LIMIT 5;",
    orderMatters: true,
  },
  {
    id: "tasks-6",
    title: "Unassigned tasks",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Return the id and title of tasks with no assigned user (user_id is NULL). Column order: id, title. Order by id ascending.",
    hint: "Test user_id with IS NULL.",
    solution: "SELECT id, title FROM task WHERE user_id IS NULL ORDER BY id;",
    orderMatters: true,
  },
  {
    id: "tasks-8",
    title: "Rename a task",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Change the title of task id 1 to 'Wash the laundry'. Update only that task and no other columns.",
    hint: "Use UPDATE task with WHERE id = 1.",
    solution: "UPDATE task SET title = 'Wash the laundry' WHERE id = 1;",
    orderMatters: false,
    checkDatabaseState: true,
  },
  {
    id: "tasks-9",
    title: "Mark a task done",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Set status_id to 3 for task id 22 only. Leave every other task unchanged.",
    hint: "Update task with a WHERE clause matching id 22.",
    solution: "UPDATE task SET status_id = 3 WHERE id = 22;",
    orderMatters: false,
    checkDatabaseState: true,
  },
  {
    id: "tasks-10",
    title: "Assign an unassigned task",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Assign task id 23 to user id 11 by setting user_id to 11. Change no other rows or columns.",
    hint: "Set user_id in task where id = 23.",
    solution: "UPDATE task SET user_id = 11 WHERE id = 23;",
    orderMatters: false,
    checkDatabaseState: true,
  },
  {
    id: "tasks-11",
    title: "Set unassigned task status",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Set status_id to 1 for tasks whose user_id is NULL. These are task ids 23 and 35; change no other rows or columns.",
    hint: "Use WHERE user_id IS NULL so both unassigned tasks are updated.",
    solution: "UPDATE task SET status_id = 1 WHERE user_id IS NULL;",
    orderMatters: false,
    checkDatabaseState: true,
  },
  {
    id: "tasks-12",
    title: "Delete one task",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Delete task id 35 only. Do not delete or change any other rows.",
    hint: "Use DELETE FROM task with WHERE id = 35.",
    solution: "DELETE FROM task WHERE id = 35;",
    orderMatters: false,
    checkDatabaseState: true,
  },
  {
    id: "tasks-13",
    title: "Remove one task tag",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Remove the Personal tag association (tag_id 2) from task id 1 only. Do not delete the task or any other tag association.",
    hint: "Delete the matching row from task_tag using both task_id and tag_id.",
    solution: "DELETE FROM task_tag WHERE task_id = 1 AND tag_id = 2;",
    orderMatters: false,
    checkDatabaseState: true,
  },
  {
    id: "tasks-14",
    title: "Create task notes table",
    difficulty: "Easy",
    datasetId: "tasks",
    prompt:
      "Create a table named task_note with columns in this order: id INTEGER PRIMARY KEY, task_id INTEGER NOT NULL, note TEXT NOT NULL. Add a foreign key from task_id to task(id).",
    hint: "Use CREATE TABLE with a table-level FOREIGN KEY constraint.",
    solution: `CREATE TABLE task_note (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES task(id)
);`,
    orderMatters: false,
    checkDatabaseState: true,
  },
];

export function challengesByDataset(): Record<string, Challenge[]> {
  const grouped: Record<string, Challenge[]> = {};
  for (const c of CHALLENGES) (grouped[c.datasetId] ??= []).push(c);
  return grouped;
}
