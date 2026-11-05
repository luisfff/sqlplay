export interface ClassExercise {
  id: string;
  title: string;
  datasetId: string;
  introduction: string;
  steps: string[];
}

// Adapted for SQLPlay from the Databases Week 1 session plan.
export const CLASS_EXERCISES: ClassExercise[] = [
  {
    id: "class-explore",
    title: "2.5 Explore the database",
    datasetId: "tasks",
    introduction: "Explore the Tasks database using SQLPlay. Try SELECT queries, PRAGMA table_info(task), and sqlite_master; the Playground also has a schema and ER diagram.",
    steps: [
      "What tables can you find?",
      "Find a diagram of the database in Playground.",
      "What columns and data types does the task table have?",
      "What kind of data is stored in the task table?",
      "Explore the data in the tables.",
      "What is the title of the task with id = 18?",
    ],
  },
  {
    id: "class-select",
    title: "3.7 Practice SELECT queries",
    datasetId: "tasks",
    introduction: "Write and run a query for each question.",
    steps: [
      "List the names and phones of all users.",
      "List all users, ordered alphabetically by name.",
      "Find the name of the user with id = 10.",
      "Find the 3 oldest tasks based on creation date.",
      "Bonus: Find all tasks that have no description.",
      "Bonus: Find all users whose email ends with .com.",
      "List the titles of all tasks that are not started.",
      "Find the tasks assigned to user 1 that are in progress.",
      "Find tasks whose title contains database.",
      "List the names of users who have no phone number.",
      "Show the five newest tasks by creation date, including titles and creation dates.",
      "List tasks that are either not started or in progress, ordered by title.",
    ],
  },
  {
    id: "class-update",
    title: "3.8 Practice UPDATE",
    datasetId: "tasks",
    introduction: "Before each update, SELECT the target row and record its original value. Check the change, then restore and check the original value. Use NULL without quotes for a missing value. Look up status IDs in the status table.",
    steps: [
      "Change the status of task 1 to Done, then restore it.",
      "Change the description of task 2 to Write and test SELECT queries, then restore it.",
      "Change the title of task 3 to Practice: Review query results, then restore it.",
      "Change the due date of task 4 to 2031-01-15, then restore it.",
      "Change the phone number of user 1 to 12345678, then restore it.",
      "Change the name of tag 1 to Practice, then restore it.",
    ],
  },
  {
    id: "class-insert-delete",
    title: "3.9–3.10 Practice INSERT and DELETE",
    datasetId: "tasks",
    introduction: "Run the INSERT steps first, then the DELETE steps in this same exercise. For each task provide title, created, updated and status_id; use datetime('now') for both timestamps and look up status IDs. After each insert, SELECT and record the table and ID. Use distinctive values. Before each DELETE, SELECT with the same WHERE clause; check again afterward. Delete only your own rows.",
    steps: [
      "INSERT 1: Add a task titled Practice 1: Read SQL, with status Not started and assigned to user 1.",
      "INSERT 2: Add Practice 2: Write queries, with status Not started and a description of your choice.",
      "INSERT 3: Add Practice 3: Review results, with status In progress and assigned to user 1.",
      "INSERT 4: Add Practice 4: Plan a project, with status Not started and a due date of 2030-12-31.",
      "INSERT 5: Add a user with a distinctive name and email of your choice; leave phone empty and do not assign this user to tasks.",
      "INSERT 6: Add a tag with a distinctive name of your choice.",
      "DELETE 1: Delete the task you added in INSERT 1.",
      "DELETE 2: Delete the user you added in INSERT 5.",
      "DELETE 3: Delete the tag you added in INSERT 6.",
    ],
  },
  {
    id: "class-create-table",
    title: "3.11 Create a table",
    datasetId: "tasks",
    introduction: "Practice creating a table and inspecting its data. If the table already exists, choose another name; do not remove an existing table.",
    steps: [
      "Create practice_note with id INTEGER PRIMARY KEY, title TEXT NOT NULL, and optional details TEXT.",
      "Inspect the table's columns, then insert a note titled First note with details Practising CREATE TABLE.",
      "SELECT the note and check its automatically assigned id, title, and details.",
    ],
  },
  {
    id: "class-crud",
    title: "3.12 Interactive CRUD practice",
    datasetId: "tasks",
    introduction: "Run each step and inspect the result before continuing. Use the ID of the task you created, not an original task.",
    steps: [
      "Retrieve all tasks.",
      "Add a task titled Prepare presentation, with created and updated set to datetime('now'), status_id 1 and user_id 1.",
      "Find the new task and record its id. If several have this title, use the highest id.",
      "Update your task's status_id to 2 and SELECT it to verify the change.",
      "SELECT your task by id, delete it, and SELECT again to confirm it is gone.",
    ],
  },
  {
    id: "class-combine",
    title: "3.13 Combine everything",
    datasetId: "tasks",
    introduction: "Complete these steps together in this exercise's database. Check the intended rows with SELECT before UPDATE or DELETE.",
    steps: [
      "Add yourself as a new user; name and email are required.",
      "Find your new user's id.",
      "Create 2 or more tasks assigned to yourself using that id as user_id. Include the required task columns.",
      "Update one of your tasks to In progress.",
      "Retrieve only the title and description of all tasks assigned to you.",
      "Delete a task you no longer need.",
      "Create practice_book with id INTEGER PRIMARY KEY, required title TEXT, and optional author TEXT. If it already exists, choose another name.",
      "Insert a book into your new table, SELECT its id, title, and author, and inspect the table.",
    ],
  },
];
