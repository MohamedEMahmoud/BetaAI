const winston = require('winston');

const dateFormat = () => {
    return new Date(Date.now()).toLocaleString();
}

const loggerTransports = (route) => {
    const obj = {
        'admin': process.env.ADMIN_PATH,
        'auth': process.env.AUTH_PATH,
        'cart': process.env.CART_PATH,
        'checkout': process.env.CHECKOUT_PATH,
        'coupon': process.env.COUPON_PATH,
        'course': process.env.COURSE_PATH,
        'instructor': process.env.INSTRUCTOR_PATH,
        'notification': process.env.NOTIFICATION_PATH,
        'recruiter': process.env.RECRUITER_PATH,
        'super': process.env.SUPER_PATH,
        'user': process.env.USER_PATH,
        'wishlist': process.env.WISHLIST_PATH,
    }

    for (const property in obj) {
        if (route === property) {
            return new winston.transports.File({ filename: `${obj[property]}/${route}.log` })
        }
    }
}

class LoggerServices {
    constructor(route) {
        this.route = route;
        let logger = winston.createLogger({
            level: 'info',
            format: winston.format.printf(info => {
                let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${info.message} `;
                message = info.obj && info.level === 'info' ? message + `| data:${JSON.stringify(info.obj)}` : (info.obj && info.level === 'error' || info.level === 'debug' || info.level === 'warn' )? message + `| ${JSON.stringify(info.obj)}` : message;
                return message;
            }),
            transports: [
                new winston.transports.Console(),
                loggerTransports(route),
            ],
        });
        this.logger = logger
    }

    async info(message) {
        this.logger.log('info', message);
    }
    async info(message, obj) {
        this.logger.log('info', message, { obj })
    }

    async error(message) {
        this.logger.log('error', message);
    }
    async error(message, obj) {
        this.logger.log('error', message, { obj })
    }

    async debug(message) {
        this.logger.log('debug', message);
    }
    async debug(message, obj) {
        this.logger.log('debug', message, { obj })
    }

    async warn(message) {
        this.logger.log('warn', message);
    }
    async warn(message, obj) {
        this.logger.log('warn', message, { obj })
    }
}

module.exports = LoggerServices