const db = require(__dirname + "/../../models"),
    User = db.user,
    Role = db.role,
    jwt = require("jsonwebtoken"),
    crypto = require('crypto'),
    bcrypt = require("bcrypt"),
    moment = require('moment');

verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')

        const decoded = jwt.verify(token, process.env.SECRET);

        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        req.token = token;

        req.user = user;

        next()
    } catch (e) {
        res.status(401).send({ status: 401, message: "Unauthorized", success: false });
    }
};

isAdmin = (req, res, next) => {
    User.findById(req.user._id).exec((err, user) => {
        if (err) {
            res.status(500).send({ status: 500, message: err, success: false });
            return;
        }

        Role.find(
            {
                _id: { $in: user.roles }
            },
            (err, roles) => {
                if (err) {
                    res.status(500).send({ status: 500, message: err, success: false });
                    return;
                }

                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].name === "admin") {
                        next();
                        return;
                    }
                }

                res.status(401).send({ status: 401, message: "Unauthorized", success: false });

            }
        );
    });
};


isInstructor = (req, res, next) => {
    User.findById(req.user._id).exec((err, user) => {
        if (err) {
            res.status(500).send({ status: 500, message: err, success: false });
            return;
        }

        Role.find(
            {
                _id: { $in: user.roles }
            },
            (err, roles) => {
                if (err) {
                    res.status(500).send({ status: 500, message: err, success: false });
                    return;
                }

                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].name === "instructor") {
                        next();
                        return;
                    }
                }
                res.status(401).send({ status: 401, message: "Unauthorized", success: false });
            }
        );
    });
};

isRecruiter = (req, res, next) => {
    User.findById(req.user._id).exec((err, user) => {
        if (err) {
            res.status(500).send({ status: 500, message: err, success: false });
            return;
        }

        Role.find(
            {
                _id: { $in: user.roles }
            },
            (err, roles) => {
                if (err) {
                    res.status(500).send({ status: 500, message: err, success: false });
                    return;
                }

                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].name === "recruiter") {
                        next();
                        return;
                    }
                }

                res.status(401).send({ status: 401, message: "Unauthorized", success: false });

            }
        );
    });
};

isSuper = (req, res, next) => {
    User.findById(req.user._id).exec((err, user) => {
        if (err) {
            res.status(500).send({ status: 500, message: err, success: false });
            return;
        }

        Role.find(
            {
                _id: { $in: user.roles }
            },
            (err, roles) => {
                if (err) {
                    res.status(500).send({ status: 500, message: err, success: false });
                    return;
                }

                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].name === "super") {
                        next();
                        return;
                    }
                }

                res.status(401).send({ status: 401, message: "Unauthorized", success: false });

            }
        );
    });
};

checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // Username
        const username = await User.findOne({ username: req.body.username });

        if (username) {
            throw { message: "Username is already in use!", status: 400, success: false };
        }
        // Email
        const email = await User.findOne({ email: req.body.email });

        if (email) {
            throw { status: 400, message: "Email is already in use!", success: false };
        }

        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
};

emailAndPasswordValidation = (req, res, next) => {
    try {
        const emailFormValidation = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        const passwordSpecialCharsValidation = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

        if (!req.body.name) {
            throw { message: "Name is required" }
        }

        if (!emailFormValidation.test(req.body.email)) {
            throw { message: "Invalid email" }
        }

        if (!req.body.username || req.body.username.length < 8) {
            throw { message: "Username must be more than 8 characters." }
        }

        // check for whitespaces in username
        if (/\s/gi.test(req.body.username)) {
            throw { status: 422, message: "Invalid username", success: false }
        }

        if (!req.body.password || req.body.password.length < 8) {
            throw { message: "Password must be more than 8 characters." }
        }

        if (!passwordSpecialCharsValidation.test(req.body.password)) {
            throw { message: "Password must contain a special character." }
        }

        if (req.body.password.toLowerCase().includes("password") || req.body.password.toLowerCase().includes("qwerty") || req.body.password.toLowerCase().includes("asdf")) {
            throw { message: "For security reasons! The Password can contain neither 'password' nor 'qwerty' nor 'asdf'." }
        }

        if (!req.body.government || !req.body.country) {
            throw { message: "Location is required" }
        }

        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

checkRolesExisted = (req, res, next) => {
    try {
        if (req.body.roles) {
            for (let i = 0; i < req.body.roles.length; i++) {
                if (!ROLE.includes(req.body.roles[i])) {
                    throw {
                        status: 401,
                        message: `Unauthorized`,
                        success: false
                    }
                }
            }
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
};
 
confirmation = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user && !user.hasAccess) {

            await Promise.all(
                user.ban.map(userBan => {
                    if (userBan.end_in && (userBan.end_in === new Date() || userBan.end_in > new Date())) {
                        throw { status: 400, message: `${user.email} is ban and reason ${userBan.reason} to ${moment(userBan.end_in).format('DD/MM/YYYY')} time left in ${moment(userBan.end_in, 'YYYY.MM.DD').fromNow()}`, success: false }
                    }
                    if(!userBan.end_in){
                        throw { status: 400, message: `${user.email} is ban and reason ${userBan.reason} forever`, success: false }
                    }
                })
            )
        }
        next()
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

cancelBan = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        await Promise.all(
                user.ban.map(async userBan => {
                    if (userBan.end_in && (userBan.end_in === new Date() || userBan.end_in < new Date())) {
                        user.hasAccess = true;
                        await user.save();
                    }
                })
            )
        next()
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

checkForUpdateOverWrite = async (req, res, next) => {
    try {
        if (req.body.username && (req.user.username === req.body.username)) {
            throw { status: 409, message: `Your username is already ${req.body.username}`, success: false };
        }

        if (req.body.email && (req.user.email === req.body.email)) {
            throw { status: 409, message: `Your email is already ${req.body.email}`, success: false };
        }

        if (req.body.name && (req.user.name === req.body.name)) {
            throw { status: 409, message: `Your name is already ${req.body.name}`, success: false };
        }

        if (req.body.password) {
            let isTheSamePassword = await bcrypt.compareSync(
                req.body.password,
                req.user.password
            );

            if (isTheSamePassword) {
                throw { status: 409, message: "Can not change password with the previous one", success: false };
            }
        }

        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}


generate = async (req, res, next) => {
    try {

        let value = "";
        let possibles = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 6; i++) {
            value += possibles.charAt(Math.floor(Math.random() * possibles.length));
        }

        req.secretCode = encrypt(value.toLowerCase());

        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}


decryption = async (req, res, next) => {
    try {
        const splitHash = req.query.code.split('-');

        const hash = {
            iv: splitHash[0],
            content: splitHash[1]
        }

        const user = await User.findOne({ 'secretCode.iv': hash.iv, 'secretCode.content': hash.content });

        const isTheSameCode = await decrypt(hash) === await decrypt(user.secretCode);

        if (isTheSameCode) {
            req.user = user;
        }
        else {
            throw { status: 400, message: 'invalid email', success: false };
        }
        next();

    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

const Jwt = {
    verifyToken,
    isAdmin,
    isInstructor,
    isRecruiter,
    isSuper,
} 

const verifySignUp = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted,
    emailAndPasswordValidation
};

const verifyHasAccess = {
    confirmation,
    cancelBan
}

const verifyUpdate = {
    checkForUpdateOverWrite,
}

const secretCode = {
    generate,
    decryption
}

module.exports = {
    Jwt,
    verifySignUp,
    verifyHasAccess,
    verifyUpdate,
    secretCode
};

const encrypt = (text) => {
    const CRYPTO_KEY = process.env.CRYPTO_KEY;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', CRYPTO_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text.toString()), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};


const decrypt = (hash) => {
    const CRYPTO_KEY = process.env.CRYPTO_KEY;
    const decipher = crypto.createDecipheriv('aes-256-ctr', CRYPTO_KEY, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrpyted.toString();
};

