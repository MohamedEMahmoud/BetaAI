const db = require(__dirname + "/../../models"),
    Chat = db.chat,
    Payment = db.payment,
    Course = db.course,
    User = db.user;

// ShowInstructoToStudent and showStudentFriend
exports.getAllChats = async (req, res) => {
    try {
        const salesCourse = await Payment.find({ buyer: req.user._id });
        const user = await User.findOne({ _id: req.user._id }).populate([
            {
                path: 'chats.friend',
                model: 'User',
                select: '_id name username email sex age image address phone government country level',
            }
        ])
        if (salesCourse.length > 0) {
            const courses = await Course.find({ _id: { $in: salesCourse.map(id => id.course) } });

            const authors = [...new Set(courses.map(course => course.author).toString().split(','))];

            // delete instructor if was a friend
            for (let i = 0; i < user.chats.map(chat => chat.friend._id).length; i++) {
                var authorIndex = authors.indexOf(user.chats.map(chat => chat.friend._id.toString())[i]);
                authors.splice(authorIndex, 1);
            }

            const instructors = await User.find({ _id: { $in: authors } });

            const chats = user.chats.concat({ unfriend: instructors });

            res.status(200).send({ status: 200, chats, success: true });
        }
        else {
            res.status(200).send({ status: 200, chats: user.chats, success: true });
        }
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }

}

exports.addInstructorAsFriendToStudentAndOpposite = async (req, res) => {
    try {
        const instructor = await User.findOne({ _id: req.query.instructor });

        const student = await User.findOne({ _id: req.user._id });

        const chat = await Chat.findOne({ sender: instructor._id, receiver: student._id });
        if (!chat) {
            const newChat = await new Chat({
                sender: instructor._id,
                receiver: student._id,
            });

            student.chats = [...student.chats, { friend: instructor._id, chat: newChat._id }];
            await student.save();

            instructor.chats = [...instructor.chats, { friend: student._id, chat: newChat._id }];

            await instructor.save();
            await newChat.save();
        }
        res.status(200).send({ status: 200, chat, success: true });
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }

}

exports.search = async (req, res) => {
    try {
        let friendExist, friendIsNotExist, friend = [];
        const users = await User.find({ name: req.body.name });
        const search = elment => elment === true;
        await Promise.all(
            req.user.chats.map(async chat => {
                if (users.map(user => user._id.equals(chat.friend)).includes(true)) {
                    friendExist = true;
                    friend = [...friend, users[users.map(user => user._id.equals(chat.friend)).findIndex(search)]]
                }
                else {
                    friendIsNotExist = true;
                }
            })
        ).then(() => {
            if (friendExist) {
                res.status(200).send({ status: 200, user: friend, success: true })
            }
            if (friendIsNotExist) {
                throw { status: 400, message: 'user is not friend', success: false }
            }
        })
            .catch((e) => {
                console.log(e)
                res.status(e.status || 500).send({
                    status: e.status || 500,
                    message: e.message || "Server is not ready now",
                    success: false
                })
            })

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}