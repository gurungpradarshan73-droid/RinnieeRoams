import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("roams.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place TEXT NOT NULL,
    user TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // API Routes
  app.get("/api/comments/:place", (req, res) => {
    const { place } = req.params;
    const comments = db.prepare("SELECT * FROM comments WHERE place = ? ORDER BY timestamp DESC").all(place);
    res.json(comments);
  });

  // Socket.io
  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("join_place", (place) => {
      socket.join(place);
    });

    socket.on("send_comment", (data) => {
      const { place, user, message } = data;
      const stmt = db.prepare("INSERT INTO comments (place, user, message) VALUES (?, ?, ?)");
      const info = stmt.run(place, user, message);
      
      const newComment = {
        id: info.lastInsertRowid,
        place,
        user,
        message,
        timestamp: new Date().toISOString()
      };

      io.to(place).emit("new_comment", newComment);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
