import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

import dotenv from "dotenv";
// import prisma from "./lib/prisma-client.js";
import authRouter from "./routers/auth.router.js";
import chatRouter from "./routers/chat.router.js";
import { checkUser } from "./middlewares/checkUser.js";
import { insertChat, addMessage } from "./controllers/chat.controller.js";
import { verifyToken } from "./lib/jwt.js";
import path, { dirname } from "path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../dist")));

app.use("/api/auth", authRouter);
app.use("/api/chat", checkUser, chatRouter);

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../dist", "index.html"))
);
app.get("/*", (req, res) =>
  res.sendFile(path.join(__dirname, "../dist", "index.html"))
);

/* creation of server */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

/* niddleware for socket */
io.use(async (socket, next) => {
  const handShakes = socket.handshake.auth.token;
  const verif = await verifyToken(handShakes);
  console.log(verif);

  if (verif) {
    socket.session = {
      id: verif.id,
      name: verif.name
    };
    next();
  } else {
    const err = new Error("unauthorized");
    // console.error(err.message);
    socket.send(err.message);
  }
});

const getSocketId = (id) => {
  return new Promise((next) => {
    io.sockets.sockets.forEach((socket) => {
      console.log("socket", socket?.session, id);
      if (socket.session.id === id) {
        next(socket.id);
      }
    });
    next(null);
  });
};
const getUsers = (id) => {
  const outPut = [];
  return new Promise((next) => {
    io.sockets.sockets.forEach((socket) => {
      if (socket.session.id !== id) {
        outPut.push({
          id: socket.session.id,
          socketId: socket.id,
          name: socket.session.name
        });
      }
    });
    next(outPut);
  });
};

/* connexion of socket */
io.on("connection", async (socket) => {
  socket.on("getUsers", async (cb) => {
    const users = await getUsers(socket.session.id);
    // console.log("users:", users);
    cb(users);
  });
  socket.on("sendMessage", async (data, cb) => {
    console.log(data);
    let ju;
    if (data.chatId) {
      ju = await addMessage({ ...data, xenderId: socket.session.id });
    } else {
      ju = await insertChat({ ...data, userId: socket.session.id });
    }

    if (ju.status) {
      const sendData = data.chatId
        ? { message: ju.message, userId: ju.userId, contactId: ju.contactId }
        : { ...ju.chat, messages: [ju.message] };
      const contactSoketId = await getSocketId(data.contactId);
      console.log(contactSoketId);
      if (contactSoketId) {
        socket.to(contactSoketId).emit("sendMessage", {
          data: sendData,
          isnew: data.chatId ? false : true
        });
      }
      cb(sendData);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  /* if (socketId) {
    socket.to(socketId).emit("socket", "For your socket id");
  } */

  /*  socket.emit("salutation", "hello for emit");
  socket.on("helloServer", (data) => {
    console.log(data);
  }); */

  /* socket.on("disconnect", () => {
    console.log("user disconnected");
  }); */
});

server.listen(4000, () => {
  console.log("Server is running on port 4000");
});
