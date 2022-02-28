const db = require(__dirname + "/../../../models"),
    Message = db.message;


const isSeenMessage = async (data, socket) => {
    try {
        const message = await Message.findOne({ chat: data.chatId, content: data.content });
        message.seen = true;
        await message.save();
        data = message;
    } catch (e) {
        socket.on('error', (e) => {
            socket.emit('ErrorMessage', e);
            console.log(e);
        });
    }
}


module.exports = io => {
    // get all chats and isOnline
    io.on('connection', socket => {
        // when user2 is seen message
        socket.on("seen", (data) => {
            isSeenMessage(data, socket)
                .then(() => {
                    socket.emit("seen", data);
                })
                .catch(e => {
                    socket.on('error', (e) => {
                        socket.emit('ErrorMessage', e);
                        console.log(e);
                    });
                })
        });
    })
}

