const db = require(__dirname + "/../../../models"),
    User = db.user;

    const getAllChats = async (id, socket) => {
    try {
        const user = await User.findOne({ _id: id }).populate([
            {
                path: 'chats.friend',
                model: 'User',
                select: '_id name username email sex age image address phone government country level'
            },
        ])
        socket.emit('chats', { status: 200, chats: user.chats, success: true });

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
        socket.on('getOnlineFriends', id => {
            getAllChats(id, socket)
                .then(friends => {

                    let onlineFriends = friends.filter(friend => io.onlineUsers[friend.id]);

                    console.log(onlineFriends);

                    socket.emit('onlineFriends', onlineFriends);

                }).catch(e => {
                    socket.on('error', (e) => {
                        socket.emit('ErrorMessage', e);
                        console.log(e);
                    });
                })
        })
    })

}
