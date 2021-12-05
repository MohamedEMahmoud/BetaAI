const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'upload')
    },
    filename: function(req, file, cb) {
        console.log(file)
        cb(null, file.originalname)
    }
})

upload = multer({ storage });

validationPhoto = async (req, res, next) => {
    try {
        if (req.files.image) {
            req.files.image.map(file => {
                if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                    throw {status: 400, message: `${file.originalname} should be a valid image`, success: false};
                }
                if (file.size > 1000000) {
                    throw {status: 400, message: `${file.originalname} is larger`, success: false};
                }
            })
        }
        if (req.files.thumbnail) {
            req.files.thumbnail.map(file => {
                if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                    throw {status: 400, message: `${file.originalname} should be a valid image`, success: false};
                }
                if (file.size > 1000000) {
                    throw {status: 400, message: `${file.originalname} is larger`, success: false};
                }
            })
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

validationVideo = async (req, res, next) => {
    try {
        if (req.files.preview_course) {
            req.files.preview_course.map(file => {
                if (!file.originalname.match(/\.(webm|mpg|mp2|mpeg|mpe|mpv|ogg|mp4|m4p|m4v|avi|wmv|mov|qt|flv|swf)$/)) {
                    throw {status: 400, message: `${file.originalname} should be a valid video`, success: false};
                }
                if (file.size > 300000000) {
                    throw {status: 400, message: `${file.originalname} is larger`, success: false};
                }
            })
        }
        if (req.files.preview_lecture) {
            req.files.preview_lecture.map(file => {
                if (!file.originalname.match(/\.(webm|mpg|mp2|mpeg|mpe|mpv|ogg|mp4|m4p|m4v|avi|wmv|mov|qt|flv|swf)$/)) {
                    throw {status: 400, message: `${file.originalname} should be a valid video`, success: false};
                }
                if (file.size > 300000000) {
                    throw {status: 400, message: `${file.originalname} is larger`, success: false};
                }
            })
        }
        if (req.files.lecture_video) {
            req.files.lecture_video.map(file => {
                if (!file.originalname.match(/\.(webm|mpg|mp2|mpeg|mpe|mpv|ogg|mp4|m4p|m4v|avi|wmv|mov|qt|flv|swf)$/)) {
                    throw {status: 400, message: `${file.originalname} should be a valid video`, success: false};
                }
                if (file.size > 300000000) {
                    throw {status: 400, message: `${file.originalname} is larger`, success: false};
                }
            })
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

validationMedia = async (req, res, next) => {
    try {
        if (req.files.media) {
            req.files.media.map(file => {
                if (!file.originalname.match(/\.(txt|docx|pdf|rar|zip)$/)) {
                    throw {status: 400, message: `${file.originalname} should be a valid file`, success: false};
                }
                if (file.size > 5000000) {
                    throw {status: 400, message: `${file.originalname} is larger`, success: false};
                }
            })
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

validateApplicantCV = async (req, res, next) => {
    try {
        if (req.files) {
            if (req.files.cv) {
                req.files.cv.map(file => {
                    if (!file.originalname.match(/\.(txt|docx|pdf|rar|zip)$/)) {
                        throw {status: 400, message: `${file.originalname} should be a valid file`, success: false};
                    }
                    if (file.size > 5000000) {
                        throw {status: 400, message: `${file.originalname} is larger`, success: false};
                    }
                })
            }
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
module.exports = {
    upload,
    validationPhoto,
    validationVideo,
    validationMedia,
    validateApplicantCV
};
