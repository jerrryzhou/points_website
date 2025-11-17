import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import jwt from 'jsonwebtoken'

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
    res.json({ message: "Login successful", token });
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));