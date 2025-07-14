import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // This should match the URL of your Vite client
    origin: ["http://localhost:5173", "https://rvzo-react-chat.vercel.app"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("register", (username) => {
    console.log(`user ${socket.id} registered as ${username}`);
    socket.username = username;
  });

  socket.on("typing", () => {
    socket.broadcast.emit("user typing", { username: socket.username });
  });
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });

  socket.on("stop typing", () => {
    socket.broadcast.emit("user stopped typing", { username: socket.username });
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
