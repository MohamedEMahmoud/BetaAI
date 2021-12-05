const db = require(__dirname + "/../../../models"),
  Chat = db.chat,
  Message = db.message,
  jwt = require("jsonwebtoken");

const newMessage = async (data, socket) => {
  try {
    const newMessage = await new Message({
      chat: data.chatId,
      content: data.content,
      sender: data.sender,
    });

    const chat = await Chat.findOne({ _id: data.chatId });
    chat.lastMessage = newMessage.content;
    await chat.save();
    await newMessage.save();

    const messages = await Message.find({ chat: chat._id })
      .populate("sender")
      .populate("chat");

    socket.emit("chat", messages);
    socket.broadcast.emit("chat", messages);
  } catch (e) {
    socket.on("error", (e) => {
      socket.emit("ErrorMessage", e);
      console.log(e);
    });
  }
};

const getAllMessages = async (chatId, socket) => {
  try {
    const messages = await Message.find({ chat: chatId }).populate([
      {
        path: "chat",
        model: "Chat",
      },
      {
        path: "sender",
        model: "User",
        select:
          "_id name username email sex age image address phone government country level",
      },
    ]);
    socket.emit("chat", { status: 200, messages, success: true });
  } catch (e) {
    // socket emit error
    socket.on("error", (e) => {
      socket.emit("ErrorMessage", e);
      console.log(e);
    });
  }
};

module.exports = (io) => {
  // private chat
  io.on("connection", (socket) => {
    // from front send chatId
    socket.on("joinChat", (chatId) => {
      getAllMessages(chatId, socket)
        .then(() => {
          socket.join(chatId);
        })
        .catch((e) => {
          socket.on("error", (e) => {
            socket.emit("ErrorMessage", e);
            console.log(e);
          });
        });
    });

    // getAllMessages
    socket.on("getMessages", (chatId) => {
      Message.find({ chat: chatId })
        .populate("sender", "name username _id image email")
        .exec((err, message) => {
          if (err) {
            socket.emit("ErrorMessage", err);
          }
          socket.emit("chat", message);
        });
    });

    // getAllChats
    socket.on("getMessages", (chatId) => {
      Message.find({ chat: chatId })
        .populate("sender", "name username _id image email")
        .exec((err, message) => {
          if (err) {
            socket.emit("ErrorMessage", err);
          }
          socket.emit("chat", message || []);
        });
    });

    socket.on("sendMessage", (data) => {
      data.sender = jwt.verify(data.sender, process.env.SECRET);

      // msg data from client {chatId, content, sender}
      newMessage(data, socket)
        .then(() => {
          io.join(data.chatId).emit("chat", data);
        })
        .catch((e) => {
          socket.on("error", (e) => {
            socket.emit("ErrorMessage", e);
            console.log(e);
          });
        });
    });
  });
};

// this code is write in medical-pharam
// const jwt       = require("jsonwebtoken"),
//     Chat        = db.chat,
//     Patient     = db.patient,
//     Doctor      = db.doctor,
//     Message     = db.message;

// const newMessage = async (data, socket) => {
//     try {
//         let type = "Patient";
//         let senderType = await Patient.findOne({ _id: data.sender });

//         if (!senderType) {
//             type = "Doctor";
//         }

//         const newMessage = await new Message({
//             chat: data.chatId,
//             content: data.content,
//             sender: data.sender,
//             senderOptions: type
//         });

//         await newMessage.save();

//         const chat = await Chat.findOne({ _id: data.chatId });
//         chat.lastMessage = newMessage.content;
//         await chat.save();

//         const messages = await Message.find({ chat: chat._id }).populate("sender").populate("chat");
//         socket.emit('chat', messages);
//         socket.broadcast.emit('chat', messages);
//     } catch (e) {
//         socket.on('error', (e) => {
//             socket.emit('ErrorMessage', e);
//         });
//     }
// }

// const getAllMessages = async (chatId, socket) => {
//     try {
//         const messages = await Message.find({ chat: chatId }).populate("sender").populate("chat");
//         socket.emit('chat', messages);
//     } catch (e) {
//         // socket emit error
//         socket.on('error', (e) => {
//             socket.emit('ErrorMessage', e);
//         });
//     }
// }

// module.exports = io => {
//     io.on('connect', socket => {
//         // from front send chatId
//         socket.on('joinChat', chatId => {
//             getAllMessages(chatId, socket)
//                 .then(() => {
//                     socket.join(chatId)
//                 })
//                 .catch(e => {
//                     socket.emit('ErrorMessage', e);
//                 })
//         });

//         // getAllMessages
//         socket.on('getMessages', chatId => {
//             Message.find({ chat: chatId }).populate("sender", "name username _id image email").exec((err, message) => {
//                 if (err) {
//                     socket.emit('ErrorMessage', err);
//                 }
//                 socket.emit('chat', message);
//             })
//         });

//         // getAllChats
//         socket.on('getMessages', chatId => {
//             Message.find({ chat: chatId }).populate("sender", "name username _id image email").exec((err, message) => {
//                 if (err) {
//                     socket.emit('ErrorMessage', err);
//                 }
//                 socket.emit('chat', message || []);
//             })
//         });

//         socket.on('sendMessage', data => {
//             data.sender = jwt.verify(data.sender, process.env.SECRET);
//             // msg data from client {chatId, content, sender}
//             newMessage(data, socket)
//                 .then(() => {
//                     io.join(data.chatId).emit('chat', data);
//                 })
//                 .catch(e => {
//                     socket.emit('ErrorMessage', e);
//                 })
//         })
//     })

// }
