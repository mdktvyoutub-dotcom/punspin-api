const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "20kb" }));

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_TOKEN) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "رمز مدیریت اشتباه است." });
  }
  next();
}

app.get("/", (_req, res) => res.json({ ok: true, service: "PunSpin API" }));

app.get("/challenges", async (_req, res) => {
  const { data, error } = await supabase
    .from("challenges")
    .select("id, challenge_text, author_name, status, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post("/challenges", async (req, res) => {
  const challengeText = String(req.body?.challenge_text || "").trim();
  const authorName = String(req.body?.author_name || "ناشناس").trim().slice(0, 24) || "ناشناس";

  if (challengeText.length < 4 || challengeText.length > 300) {
    return res.status(400).json({ error: "متن چالش باید بین ۴ تا ۳۰۰ کاراکتر باشد." });
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      challenge_text: challengeText,
      author_name: authorName,
      status: "pending"
    })
    .select("id, challenge_text, author_name, status, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.get("/admin/challenges", requireAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from("challenges")
    .select("id, challenge_text, author_name, status, created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.patch("/admin/challenges/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "");
  const allowed = ["pending", "approved", "rejected", "completed"];

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "شناسه چالش نامعتبر است." });
  }
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "وضعیت نامعتبر است." });
  }

  const { data, error } = await supabase
    .from("challenges")
    .update({ status })
    .eq("id", id)
    .select("id, challenge_text, author_name, status, created_at")
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "چالش پیدا نشد." });
  res.json(data);
});

app.delete("/admin/challenges/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "شناسه چالش نامعتبر است." });
  }

  const { data, error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "چالش پیدا نشد." });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`PunSpin API listening on ${PORT}`));
