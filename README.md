# SQLPlay Live

SQLPlay Live is a website for learning and practicing SQL, the language used to
ask questions about data. You can explore sample data, write a question, and see
the results in your browser. You do not need to install anything to get started.

**Website (once Pages is enabled and deployment succeeds):
[SQLPlay Live](https://luisfff.github.io/sqlplay/).**

## Get started

1. Open the website.
2. Choose **Playground** to explore a dataset, or **Challenges** to practice a
   question.
3. Select a dataset or challenge, then follow the instructions on screen.

The Playground starts with the **Tasks** dataset. It is a good place to look
around before trying a challenge.

## Explore datasets

A dataset is a collection of related tables. Tables organize information into
rows and columns, like a spreadsheet.

In **Playground**, use the **Dataset** menu to choose a dataset. The table list
shows the available tables and fields. Click a table name to add a starter query
to the editor.

You can write a SQL query in the editor and select **Run** to see what it finds.
For example, a query can ask to see certain rows, combine information from
tables, or count items.

## Use datasets for challenges

Each challenge has a question to answer using data. Select **Challenges** and
choose a question from the list. SQLPlay loads the dataset for that challenge,
so you can focus on the question rather than setting up the data.

1. Read the challenge instructions.
2. Write a query in the editor.
3. Select **Check answer** to see whether your result matches what the question
   asks for.
4. If you get stuck, select **Hint** for a nudge. **Show solution** reveals an
   example answer you can learn from.

Your completed challenges are remembered when you return to the website.

## Tips

- Read the full question before writing your query. Notice which information it
  asks for and whether the results need to be in a particular order.
- Check the table list for the names of the tables and fields you can use.
- If a query does not work, read the message shown on the page and check the
  spelling of the table and field names.
- Use **Run** to explore data in Playground, and **Check answer** to submit a
  challenge answer.
- Changing datasets or challenges replaces the current work. If you want to
  keep a query, copy it somewhere before switching.

## Frequently asked questions

**Do I need to install anything?**

No. Open the website in your browser to begin.

**Can I change or save a dataset?**

You can explore and make changes in Playground. To keep a changed dataset, use
**Save dataset**. Saved datasets stay in the browser where you created them.

**Where did my changes go?**

Changes you have not saved may be cleared when you switch datasets or
challenges, or reload the page. Save a dataset before leaving if you want to
keep your changes.

**What if my answer is marked incorrect?**

Read the challenge again, check that your query uses the right tables and fields,
and try a hint. Some questions also require results in a specific order.

## Project structure

- `src/`: browser app, SQLite engine, and library/server entry points.
- `public/`: static images and favicon; `docs/`: guides and screenshots.
- `bin/`: local CLI; `scripts/`: documentation tooling.
- `dist/` and `dist-lib/`: generated website and library builds (not committed).
- `.github/workflows/pages.yml`: validation and website deployment.

The complete project now lives at the repository root so this README renders
on the repository homepage. The uploaded `sqlplay-live-main.zip` was inspected:
all 53 application files matched the nested project byte-for-byte. Its only
additional files were an ignore file and two older workflows, replaced by the
root `.gitignore` and current workflow. The redundant archive and nested folders
were removed. The MIT license retains both original copyright notices.

## Local development and checks

Use Node.js 22 LTS and run these commands from the repository root:

```bash
npm ci
npm run dev
```

Vite prints the local development URL. To build and preview the static website:

```bash
npm run build
npm run preview
npm run build:lib       # optional library/server package build
# npm run build:all    # build both website and library
```

Browser checks use the existing Playwright dependency:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
npm run test:e2e:pages  # built dist/ under /sqlplay/, including SQLite WASM/query
```

Build the website first. The existing e2e suite updates `docs/e2e-screenshot.png`
and `docs/screenshot-playground.png`; only commit intentional screenshot updates.

## Website deployment

This repository is **private**. GitHub Free does not include Pages for private
repositories; the owner needs an eligible paid plan (GitHub Pro for this personal
repository). Private organization repositories require GitHub Team or Enterprise
Cloud. A private source repository does **not** make its Pages site private:
the site is normally public; restricted Pages access has separate Enterprise
Cloud organization requirements. Review the
[one-time setup and official documentation](docs/DEPLOY.md#21-github-pages-for-this-repository)
before publishing.

An administrator must select **Settings → Pages → Build and deployment →
Source: GitHub Actions**, and allow the workflow's official actions. If the plan
does not support private-repository Pages, upgrade the plan or choose another
static host; this change does not alter repository visibility.

Pull requests only validate the build and browser tests. **After this PR is
merged**, pushes to `main` build and deploy `dist/`; a manual run of **Website**
on `main` can also deploy. No personal access token is needed. The expected URL
is https://luisfff.github.io/sqlplay/ after successful deployment, unless account
Pages/custom-domain settings dictate otherwise. Adding the workflow alone does
not enable Pages or mean the site is live.
