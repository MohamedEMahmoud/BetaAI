const jwt = require("jsonwebtoken");

module.exports = io => {
    // send notification
    io.on('connect', socket => {
        socket.on('joinNotificationsRoom', id => {
            const decoded = jwt.verify(id, process.env.SECRET);
            socket.join(decoded._id);
        });

        // online user
        socket.on('goOnline', id => {// get user id from token
            const decoded = jwt.verify(id, process.env.SECRET);
            io.onlineUsers[decoded._id] = true;

            socket.emit('onlineList', io.onlineUsers);
            socket.broadcast.emit('onlineList', io.onlineUsers);

            socket.on('disconnect', () => {
                io.onlineUsers[decoded._id] = false;
            });
        });

        socket.on('goOffline', (id) => {
            const decoded = jwt.verify(id, process.env.SECRET);
            io.onlineUsers[decoded._id] = false;
            socket.emit('onlineList', io.onlineUsers);
            socket.broadcast.emit('onlineList', io.onlineUsers);
        });

        // when user typing
        socket.on("typing", function (data) {
            socket.broadcast.emit("typing", data);
        });
    });

}