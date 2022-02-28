require("dotenv").config();
const app = require("express")(),
    bodyParser = require("body-parser"),
    cors = require("cors"),
    server = require("http").createServer(app),
    io = require("socket.io")(server, { transports: ["websocket"] }),
    cookieParser = require("cookie-parser"),
    morgan = require("morgan"),
    helmet = require("helmet"),
    compression = require("compression");
let whitelist = [
    "https://beta-ai.vercel.app",
    "http://localhost:3000",
    "https://web.postman.co",
    "https://betaai.tech",
    "https://www.betaai.tech",
    "http://localhost:4200",
];
let corsOptions = {
    origin: function(origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// connect to db
const db = require(__dirname + "/models");
const Role = db.role;

db.mongoose
    .connect(
        process.env.NODE_ENV === "production" ?
        `mongodb+srv://${process.env.DBUSERNAME}:${process.env.DBPASSWORD}@${process.env.DBSERVER}/${process.env.DB}` :
        `mongodb+srv://${process.env.DBUSERNAME}:${process.env.DBPASSWORD}@${process.env.DBSERVER}/${process.env.DB}_test`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => {
        console.log(
            `Successfully connect to MongoDB in ${process.env.NODE_ENV} mode`
        );
        initial();
    })
    .catch((err) => {
        console.error("Connection error", err);
        process.exit();
    });

const initial = () => {
    Role.estimatedDocumentCount(async(err, count) => {
        try {
            if (!err && count === 0) {
                const document = ["user", "instructor", "admin", "super", "recruiter"];
                for (let i in document) {
                    await new Role({ name: document[i] }).save();
                    console.log(`added ${document[i]} to roles collection`);
                }
            }
        } catch (e) {
            console.log(e);
        }
    });
};

app.use([
    /** request type configuration **/
    // parse requests of content-type - application/json
    bodyParser.json(),
    // parse requests of content-type - application/x-www-form-urlencoded
    bodyParser.urlencoded({ extended: false }),
    // morgan show requests
    morgan("dev"),
    cors(corsOptions),
    cookieParser(),
    helmet(),
    compression(),
]);

// cloudinary config
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

// start server
const PORT = process.env.PORT || 8088;
server.listen(PORT, () => console.log("Beta AI listening on port 8088"));

// require routes
require(__dirname + "/auth")(app);
require(__dirname + "/student")(app);
require(__dirname + "/course")(app);
require(__dirname + "/instructor")(app);
require(__dirname + "/compiler")(app);
require(__dirname + "/coupon")(app);
require(__dirname + "/cart")(app);
require(__dirname + "/wishlist")(app);
require(__dirname + "/checkout")(app);
require(__dirname + "/admin")(app);
require(__dirname + "/recruiter")(app);
require(__dirname + "/notification")(app);
require(__dirname + "/super")(app);
require(__dirname + "/chat")(app);
require(__dirname + "/services/loggers.services");

// require sockets
io.onlineUsers = {};
require(__dirname + "/modules/chat/sockets/init.socket")(io);
require(__dirname + "/modules/chat/sockets/online.socket")(io);
require(__dirname + "/modules/chat/sockets/chat.socket")(io);
require(__dirname + "/modules/chat/sockets/seen.socket")(io);

// todo: create app status to test app-functionality
// todo: search for duplicate files in cloudinary-storage and remove it before upload the new one

// initial route
app.get("/", (req, res) => {
    res
        .status(200)
        .json({ app: "betaAI-admin-core", core: "1.0.0", success: true });
});

// // middleware for handling invalid paths
app.use((req, res, next) => {
    res
        .status(404)
        .json({ message: "required path not found", status: 404, success: false });
    next();
});

module.exports = app;