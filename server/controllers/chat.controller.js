import prisma from "../lib/prisma-client.js";
import Gemini from "gemini-ai";
import dotenv from "dotenv";
dotenv.config();

export const createChat = async (req, res) => {
  try {
    console.log(res.locals.userId);
    const name = req.body.name;
    if (name) {
      if (typeof name === "string") {
        const chat = await prisma.chat.create({
          data: {
            name,
            userId: res.locals.userId
          }
        });
        console.log(chat);
        res.status(200).json({ chat, status: true });
      } else {
        res.json({ message: "Name must be a string" });
      }
    } else {
      res.json({ message: "Name is required" });
    }
  } catch (error) {
    console.log(error.errors);
    res.json(502).send(error.message);
  }
};

export const getChat = async (req, res) => {
  try {
    const loiu = await prisma.chat.findMany({
      where: {
        OR: [
          {
            userId: res.locals.userId
          },
          {
            contactId: res.locals.userId
          }
        ]
      },
      include: {
        user: true,
        contact: true,
        messages: true
      }
    });
    if (loiu) {
      res.json({ chat: loiu, userId: res.locals.userId , userName: res.locals.userName});
    }
  } catch (error) {
    console.log(error.message);
    res.status(502).send(error.message);
  }
};

export const getAllChatByUser = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        userId: res.locals.userId
      }
    });
    res.status(200).json({ chats, status: true });
  } catch (error) {
    console.log(error.message);
    res.status(502).send(error.message);
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const verifyUser = await prisma.chat.findFirst({
      where: {
        id: parseInt(chatId),
        userId: res.locals.userId
      }
    });
    if (verifyUser) {
      const deleteAllMessages = await prisma.message.deleteMany({
        where: {
          chatId: parseInt(chatId)
        }
      });
      if (deleteAllMessages) {
        const chat = await prisma.chat.delete({
          where: {
            id: parseInt(chatId)
          }
        });
        res.status(200).json({ chat, status: true, message: "Chat deleted" });
      } else {
        res.status(402).json({
          message: "Error while deleting all messages",
          status: false
        });
      }
    } else {
      res.status(403).json({
        message: "User not found, you can't delete this chat",
        status: false
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(502).send(error.message);
  }
};

export const addMessage = async (data) => {
  try {
    let chatId = data.chatId;
    let text = data.message;
    if (!text) {
      return { message: "Text is required", status: false };
    }
    if (chatId) {
      const chat = await prisma.chat.findFirst({
        where: {
          id: parseInt(chatId)
        }
      });
      if (chat) {
        const message = await prisma.message.create({
          data: {
            text: text,
            xenderId: data.xenderId,
            chatId: chatId
          }
        });
        if (message) {
          return {
            status: true,
            message: message,
            userId: chat.userId,
            contactId: chat.contactId
          };
        } else {
          return { message: "Message not created", status: false };
        }
      } else {
        return { status: false, message: "Chat not found" };
      }
    } else {
      return { status: false, message: "Query chatId is required" };
    }
  } catch (error) {
    console.log(error.errors);
    return { status: false, message: error.message };
  }
};

export const insertChat = async (data) => {
  const chat = await prisma.chat.create({
    data: {
      userId: data.userId,
      contactId: data.contactId
    },
    include: {
      user: true,
      contact: true
    }
  });
  if (chat) {
    const message = await prisma.message.create({
      data: {
        text: data.message,
        xenderId: data.userId,
        chatId: chat.id
      }
    });
    return { status: true, chat: chat, message: message };
  }
};

export const getMessages = async (req, res) => {
  try {
    const chatId = req.query.chatId;
    if (chatId) {
      const findChat = await prisma.chat.findFirst({
        where: {
          id: parseInt(chatId)
        },
        include: {
          messages: true
        }
      });
      if (findChat) {
        res.status(200).json({ messages: findChat.messages, status: true });
      } else {
        res.status(403).json({ message: "Chat not found" });
      }
    } else {
      res.status(402).json({ message: "Query chatId is required" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(502).send(error.message);
  }
};
