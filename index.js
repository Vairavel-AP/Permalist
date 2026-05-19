import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

// Load .env (graceful — works locally; on Railway/Render real env vars are used)
try {
  const { default: dotenv } = await import("dotenv");
  dotenv.config();
} catch {
  // dotenv not installed in production — that's fine
}

const app = express();
const port = process.env.PORT || 3000;

// ── Database (Pool supports concurrent queries — Client does NOT) ─────────────
const db = new pg.Pool({
  user:     process.env.DB_USER     || "postgres",
  host:     process.env.DB_HOST     || "localhost",
  database: process.env.DB_NAME     || "permalist",
  password: process.env.DB_PASSWORD || "your_password",
  port:     parseInt(process.env.DB_PORT) || 5432,
});

// Verify connection on startup
try {
  await db.query("SELECT 1");
  console.log("✅ Database connected");
} catch (err) {
  console.error("❌ Database connection failed:", err.message);
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
}

function isOverdue(dueDate, completed) {
  if (!dueDate || completed) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

// Safe ORDER BY — never append ASC after a CASE expression
const SORT_MAP = {
  id:         "id ASC",
  priority:   "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END",
  due_date:   "due_date NULLS LAST",
  created_at: "created_at ASC",
};

// ── Routes ────────────────────────────────────────────────────────────────────

// GET / — list items with optional filter, category, sort
app.get("/", async (req, res) => {
  try {
    const { filter = "all", category = "", sort = "id" } = req.query;
    const orderBy = SORT_MAP[sort] || "id ASC";

    let where = "WHERE 1=1";
    const params = [];

    if (filter === "active")    where += " AND completed = FALSE";
    if (filter === "completed") where += " AND completed = TRUE";
    if (filter === "overdue")   where += " AND completed = FALSE AND due_date < CURRENT_DATE";

    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }

    // Pool handles concurrent queries correctly (Client cannot)
    const [itemsResult, categoriesResult, statsResult] = await Promise.all([
      db.query(`SELECT * FROM items ${where} ORDER BY ${orderBy}`, params),
      db.query("SELECT DISTINCT category FROM items ORDER BY category"),
      db.query(`
        SELECT
          COUNT(*)                                                             AS total,
          COUNT(*) FILTER (WHERE completed = TRUE)                            AS completed,
          COUNT(*) FILTER (WHERE completed = FALSE)                           AS active,
          COUNT(*) FILTER (WHERE completed = FALSE AND due_date < CURRENT_DATE) AS overdue
        FROM items
      `),
    ]);

    const items = itemsResult.rows.map((item) => ({
      ...item,
      due_date: formatDate(item.due_date),
      overdue:  isOverdue(item.due_date, item.completed),
    }));

    res.render("index.ejs", {
      listItems:  items,
      categories: categoriesResult.rows.map((r) => r.category),
      stats:      statsResult.rows[0],
      filter,
      category,
      sort,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error — check console.");
  }
});

// POST /add
app.post("/add", async (req, res) => {
  const { newItem, priority = "medium", category = "General", due_date } = req.body;
  if (!newItem?.trim()) return res.redirect("/");
  try {
    await db.query(
      "INSERT INTO items (title, priority, category, due_date) VALUES ($1, $2, $3, $4)",
      [newItem.trim(), priority, category || "General", due_date || null]
    );
  } catch (err) { console.error(err); }
  res.redirect("/");
});

// POST /edit
app.post("/edit", async (req, res) => {
  const { updatedItemId, updatedItemTitle, updatedPriority, updatedCategory, updatedDueDate } = req.body;
  if (!updatedItemTitle?.trim()) return res.redirect("/");
  try {
    await db.query(
      "UPDATE items SET title=$1, priority=$2, category=$3, due_date=$4 WHERE id=$5",
      [updatedItemTitle.trim(), updatedPriority || "medium", updatedCategory || "General", updatedDueDate || null, updatedItemId]
    );
  } catch (err) { console.error(err); }
  res.redirect("/");
});

// POST /toggle
app.post("/toggle", async (req, res) => {
  const { itemId } = req.body;
  try {
    await db.query("UPDATE items SET completed = NOT completed WHERE id = $1", [itemId]);
  } catch (err) { console.error(err); }
  res.redirect("/");
});

// POST /delete
app.post("/delete", async (req, res) => {
  const { deleteItemId } = req.body;
  try {
    await db.query("DELETE FROM items WHERE id = $1", [deleteItemId]);
  } catch (err) { console.error(err); }
  res.redirect("/");
});

// POST /clear-completed
app.post("/clear-completed", async (req, res) => {
  try {
    await db.query("DELETE FROM items WHERE completed = TRUE");
  } catch (err) { console.error(err); }
  res.redirect("/");
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 Permalist running at http://localhost:${port}`);
});
