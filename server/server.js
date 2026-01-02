import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import jwt from 'jsonwebtoken'

const ALLOWED_POSITIONS = new Set(["member", "position-holder", "admin"]);

dotenv.config();
// console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

const app = express();
app.use(express.json());
app.use(cors());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get('/', (req, res) => {
    res.send("Server running")
})

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
   
}

function requireAdmin(req, res, next) {
  if (req.user?.position !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

app.patch("/api/members/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { position, points} = req.body;
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    if (position !== undefined && !ALLOWED_POSITIONS.has(position)) {
      return res.status(400).json({ error: "Invalid position" });
    }
    if (points !== undefined && (!Number.isFinite(points))) {
      return res.status(400).json({error: "Invalid points"});
    }
    if (req.user.id === id && position && position !== "admin") {
      return res.status(400).json({ error: "You cannot change your own admin role" });
    }

    const result = await pool.query(
      `UPDATE members
      SET position = COALESCE($1, position),
      points = COALESCE($2, points)
      WHERE id = $3
      RETURNING id, full_name, email, points, position, approved`,
      [position ?? null, points ?? null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found"});
    }
    res.json(result.rows[0]);

  } catch (err) {
    console.error("Error updating member:", err);
    res.status(500).json({ error: "Server error"});
  }
});

// app.delete("/api/members/:id", async (req, res) => {
app.delete("/api/members/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    // Optional safety: prevent deleting yourself
    if (req.user.id === id) {
      return res.status(400).json({ error: "You cannot delete yourself" });
    }

    const result = await pool.query("DELETE FROM members WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting member:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Register api, creates new member in database
app.post('/api/register', async (req, res) => { 
    const currentDate = new Date();
    const { first_name, last_name, email, password} = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO members (full_name, email, password, position, points, created_at, approved)
            VALUES ($1, $2, $3, 'member', 0, $4, FALSE)
            RETURNING full_name, email, position, points, created_at, approved`,
            [first_name + " " + last_name, email, password, currentDate]
        );

        return res.status(200).json({
            message: "Account created. Pending admin approval.",
            user: result.rows[0],
        });
    }
    catch (err) {
        console.error("Error creating account:", err);
         return res.status(500).json({ error: "Error creating account" });
    } 
})
// Need to check if logged in user is approved or not. Use token to verify authority. Can use user data for page load or token. Refresh button for dashboard
app.post('/api/login', async (req, res) => {
  const {email, password} = req.body;
  try {
    const result = await pool.query("SELECT * FROM members WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({error: "User does not exist"})
    }
    const isMatch = password === user.password;
    if (!isMatch) {
      return res.status(401).json({ error: "Wrong password" });
    }
    if (!user.approved) {
      return res.status(401).json({ error: "Account not yet approved" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, points: user.points, position: user.position },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log(token)
    // res.json({ message: "Login successful", token });
    res.json({
      message: "Login successful",
      token,
      user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      position: user.position,
      points: user.points
    }
  });
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
})

app.get('/api/unapproved-users', async(req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, created_at FROM members WHERE approved = FALSE"
    );
    res.json(result.rows);
  } catch(err) {
    console.error("Error fetching unapproved users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/get-approved-users', async(req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, points, position FROM members WHERE approved = TRUE"
    );
    res.json(result.rows);
  } catch(err) {
    console.error("Error fetching approved users:", err);
    res.status(500).json({ error: "Server error"})
  }
});

app.post("/api/approve-user", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("UPDATE members SET approved = TRUE WHERE id = $1", [id]);
    res.json({ message: "User approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/deny-user", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM members WHERE id = $1 AND approved = FALSE", [id]);
    res.json({ message: "User denied and removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "DB Connected", time: result.rows[0].now });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.post("/api/point-requests", authenticateToken, async (req, res) => {
  try {
    const giverId = req.user.id;
    const { recipientUserId, points, reason } = req.body;

    if (!recipientUserId) return res.status(400).json({ error: "recipientUserId is required" });
    if (!Number.isInteger(points)) return res.status(400).json({ error: "points must be a positive integer" });
    if (!reason || !reason.trim()) return res.status(400).json({ error: "reason is required" });

    // if (String(recipientUserId) === String(giverId)) {
    //   return res.status(400).json({ error: "You cannot give points to yourself" });
    // }

    // Optional: ensure both users are approved
    const check = await pool.query(
      `SELECT id, approved FROM members WHERE id = ANY($1::bigint[])`,
      [[giverId, recipientUserId]]
    );
    if (check.rows.length !== 2 || check.rows.some(r => !r.approved)) {
      return res.status(400).json({ error: "Both giver and recipient must be approved members" });
    }

    const result = await pool.query(
      `
      INSERT INTO point_requests (recipient_user_id, giver_user_id, points, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id, recipient_user_id, giver_user_id, points, reason, status, created_at
      `,
      [recipientUserId, giverId, points, reason.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating point request:", err);
    res.status(500).json({ error: "Failed to create point request" });
  }
});

app.get("/api/point-requests", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = (req.query.status || "pending").toLowerCase();
    if (!["pending", "approved", "denied"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `
      SELECT pr.*,
             g.full_name AS giver_name,
             r.full_name AS recipient_name
      FROM point_requests pr
      JOIN members g ON g.id = pr.giver_user_id
      JOIN members r ON r.id = pr.recipient_user_id
      WHERE pr.status = $1
      ORDER BY pr.created_at DESC
      `,
      [status]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching point requests:", err);
    res.status(500).json({ error: "Failed to load point requests" });
  }
});

app.post("/api/point-requests/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  const requestId = Number(req.params.id);
  const adminId = req.user.id;

  if (!Number.isInteger(requestId)) return res.status(400).json({ error: "Invalid request id" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      WITH updated AS (
        UPDATE point_requests
        SET status = 'approved',
            reviewed_at = now(),
            reviewed_by_user_id = $2
        WHERE id = $1 AND status = 'pending'
        RETURNING id, recipient_user_id, giver_user_id, points, reason
      ),
      inserted AS (
        INSERT INTO point_transactions (user_id, source_user_id, points, reason, request_id)
        SELECT recipient_user_id, giver_user_id, points, reason, id
        FROM updated
        RETURNING user_id, points
      )
      UPDATE members m
      SET points = m.points + inserted.points
      FROM inserted
      WHERE m.id = inserted.user_id
      RETURNING m.id, m.full_name, m.points;
      `,
      [requestId, adminId]
    );

    await client.query("COMMIT");

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Request not pending (already reviewed or not found)" });
    }

    res.json({ ok: true, updatedMember: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Approve error:", err);

    // unique violation on request_id means it was already inserted
    if (err.code === "23505") {
      return res.status(409).json({ error: "Request already approved" });
    }

    res.status(500).json({ error: "Failed to approve request" });
  } finally {
    client.release();
  }
});

app.post("/api/point-requests/:id/deny", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const adminId = req.user.id;
    const denyReason = (req.body?.denyReason || "").trim();

    if (!Number.isInteger(requestId)) return res.status(400).json({ error: "Invalid request id" });

    const result = await pool.query(
      `
      UPDATE point_requests
      SET status = 'denied',
          reviewed_at = now(),
          reviewed_by_user_id = $2,
          deny_reason = $3
      WHERE id = $1 AND status = 'pending'
      RETURNING *
      `,
      [requestId, adminId, denyReason || null]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Request not pending (already reviewed or not found)" });
    }

    res.json({ ok: true, request: result.rows[0] });
  } catch (err) {
    console.error("Deny error:", err);
    res.status(500).json({ error: "Failed to deny request" });
  }
});

app.get("/api/me/point-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        pt.id,
        pt.points,
        pt.reason,
        pt.created_at,
        g.full_name AS giver_name
      FROM point_transactions pt
      JOIN members g ON g.id = pt.source_user_id
      WHERE pt.user_id = $1
      ORDER BY pt.created_at DESC
      LIMIT 100
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Failed to load point history" });
  }
});

app.get("/api/me/point-requests", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        pr.id,
        pr.points,
        pr.reason,
        pr.status,
        pr.created_at,
        pr.reviewed_at,
        g.full_name AS giver_name
      FROM point_requests pr
      JOIN members g ON g.id = pr.giver_user_id
      WHERE pr.recipient_user_id = $1
      ORDER BY pr.created_at DESC
      LIMIT 100
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load point requests" });
  }
});

app.get("/api/leaderboard", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, full_name, points, position
      FROM members
      WHERE approved = TRUE
      ORDER BY points DESC, full_name ASC
      `
    );

    // small cache to reduce repeated hits
    res.set("Cache-Control", "public, max-age=30");
    res.json(result.rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

app.get("/api/me", authenticateToken, async (req, res) => {
  const result = await pool.query(
    "SELECT id, full_name, email, points, position FROM members WHERE id = $1",
    [req.user.id]
  );
  res.json(result.rows[0]);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));