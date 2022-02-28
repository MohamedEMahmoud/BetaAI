const db = require(__dirname + "/../../models"),
  Course = db.course,
  User = db.user,
  Role = db.role,
  Certificate = db.certificate,
  path = require("path"),
  slugify = require("slugify"),
  moment = require("moment"),
  PDFDocument = require("pdfkit"),
  Cloudinary = require("cloudinary").v2,
  fs = require("fs"),
  _ = require("lodash");

exports.createCourse = async (req, res) => {
  try {
    let courseMedia = [];
    const slugTitle = slugify(req.body.title, {
      replacement: "-",
      lower: true,
    });
    const courseExist = await Course.findOne({ slug: slugTitle });
    // todo: when create course and course exists file is uploaded in upload file fix this
    if (courseExist) {
      throw{ status: 400, message: "Course exists", success: false };
    }

    const course = await new Course(req.body);

    //store instructor upload course
    course.owner = [req.user._id];
    course.author = [...course.author, req.user._id];
    if (req.body.author) {
      const users = await User.find({ email: req.body.author });
      const instructorRole = await Role.findOne({ name: "instructor" });

      users.map((user) => {
        if (user.roles.includes(instructorRole._id)) {
          const rolesExist = course.author.map((a) => a.equals(user._id));

          course.author = rolesExist.includes(true)
            ? (() => {
                throw {
                  status: 400,
                  message: `${user.email} exists`,
                  success: false,
                };
              })()
            : [...course.author, user._id];
        } else {
          throw {
            status: 400,
            message: `${user.email} is not instructor`,
            success: false,
          };
        }
      });
    }

    if (req.body.path) {
      course.path = slugify(req.body.path, { replacement: "-", lower: true });
    }

    if (typeof req.files === "object") {
      if (req.files.image) {
        // get image path
        const path = req.files.image[0].path;

        // upload course image
        const course_img = await Cloudinary.uploader.upload(path, {
          public_id: `courses/${slugTitle}/beta-ai-${slugTitle}-main-image`,
          use_filename: true,
          tags: `course, ${slugTitle}, banner, ${req.body.type}`,
          // width: 500,
          // height: 500,
          // crop: "scale",
          placeholder: true,
        });

        course.image = course_img.secure_url;

        // save response in history
        courseMedia.push({ image: course_img });

        // remove file from server after save in storage
        if (course_img) {
          fs.unlinkSync(path);
        }
      } else {
        throw {
          status: 400,
          message: "Course image is required",
          success: false,
        };
      }

      if (req.files.preview_course) {
        // get image path
        const path = req.files.preview_course[0].path;
        // upload course preview
        const course_prev = await Cloudinary.uploader.upload(path, {
          public_id: `courses/${slugTitle}/beta-ai-${slugTitle}-course-prev`,
          resource_type: "video",
          use_filename: true,
          tags: `course, ${slugTitle}, preview, ${req.body.type}`,
          // width: 500,
          // height: 500,
          // crop: "scale",
          placeholder: true,
        });

        // todo: add BetaAI logo as overlay on every video

        course.preview_course = course_prev.secure_url;

        // save response in history
        courseMedia.push({ preview_course: course_prev });

        // remove file from server after save in storage
        if (course_prev) {
          fs.unlinkSync(path);
        }
      } else {
        throw {
          status: 400,
          message: "Course preview is required",
          success: false,
        };
      }
    }

    const history = {
      created_by: req.user.email,
      event: `create Course: ${course.title}`,
      ...req.body,
      courseMedia,
      slug: slugTitle,
      created_at: `${new Date().getDate()}/${
        new Date().getMonth() + 1
      }/${new Date().getFullYear()}`,
      time: `${new Date()
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toUpperCase()}`,
    };
    course.history = [history];

    course.slug = slugTitle;
    await course.save();

    // rename level-filed to category if type === 'lab'
    if (req.body.type === "lab") {
      await Course.updateMany(
        { type: "lab" },
        { $rename: { level: "category" } },
        { multi: true }
      );
    }

    const population = await Course.findOne({ slug: course.slug }).populate([
      {
        path: "owner",
        model: "User",
        select:
          "_id name username email sex age image address phone government country level",
      },
      {
        path: "author",
        model: "User",
        select:
          "_id name username email sex age image address phone government country level",
      },
    ]);

    res.send({ status: 200, course: population, success: true });
  } catch (e) {
    console.log(e);
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const changeSlug = (title) => {
      return (req.course.slug = slugify(title, {
        replacement: "-",
        lower: true,
      }));
    };

    const changeHistory = () => {
      if (req.body.title) {
        const history = {
          created_by: req.user.email,
          event: `update Course: ${req.course.title}`,
          ...req.body,
          ...req.files,
          slug: req.body.title ? changeSlug(req.body.title) : req.course.slug,
          created_at: `${new Date().getDate()}/${
            new Date().getMonth() + 1
          }/${new Date().getFullYear()}`,
          time: `${new Date()
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .toUpperCase()}`,
        };
        return (req.course.history = [...req.course.history, history]);
      } else {
        const history = {
          created_by: req.user.email,
          event: `update Course: ${req.course.title}`,
          ...req.body,
          ...req.files,
          created_at: `${new Date().getDate()}/${
            new Date().getMonth() + 1
          }/${new Date().getFullYear()}`,
          time: `${new Date()
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .toUpperCase()}`,
        };
        return (req.course.history = [...req.course.history, history]);
      }
    };

    const updateFiles = () => {
      if (typeof req.files === "object") {
        const { image, preview_course } = req.course;
        if (req.files.image) {
          image.data = req.files.image[0].buffer;
        }
        if (req.files.preview_course) {
          preview_course.data = req.files.preview_course[0].buffer;
        }
      }
    };

    if (req.body.author) {
      const users = await User.find({ email: req.body.author });
      const instructorRole = await Role.findOne({ name: "instructor" });
      return users.map(async (user) => {
        if (user.roles.includes(instructorRole._id)) {
          const rolesExist = req.course.author.map((a) => a.equals(user._id));
          changeHistory();
          updateFiles();
          req.course = _.extend(req.course, {
            ...req.body,
            slug: req.body.title ? changeSlug(req.body.title) : req.course.slug,
            author: rolesExist.includes(true)
              ? (() => {
                  throw {
                    status: 400,
                    message: `${user.email} exists`,
                    success: false,
                  };
                })()
              : [...req.course.author, user._id],
          });
          req.course.updatedAt = Date.now();
          await req.course.save();
          res.send({ status: 202, course: req.course, success: true });
        } else {
          throw {
            status: 400,
            message: `${user.email} is not instructor`,
            success: false,
          };
        }
      });
    } else {
      changeHistory();
      updateFiles();
      req.course = _.extend(req.course, {
        ...req.body,
        slug: req.body.title ? changeSlug(req.body.title) : req.course.slug,
      });
      req.course.updatedAt = Date.now();
      await req.course.save();
      res.send({ status: 202, course: req.course, success: true });
    }
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.singleCourse = async (req, res) => {
  try {
    res.status(200).send({ status: 200, course: req.course, success: true });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.allInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ author: req.user._id }).populate([
      {
        path: "owner",
        model: "User",
        select:
          "_id name username email sex age image address phone government country level",
      },
      {
        path: "author",
        model: "User",
        select:
          "_id name username email sex age image address phone government country level",
      },
      {
        path: "sections",
        model: "Section",
        populate: [
          {
            path: "lectures",
            model: "Lecture",
            populate: [
              {
                path: "questions",
                model: "Question",
                populate: [
                  {
                    path: "student",
                    model: "User",
                    select:
                      "_id name username email sex age image address phone government country level",
                  },
                  {
                    path: "answers",
                    model: "Answer",
                    populate: {
                      path: "user",
                      model: "User",
                      select:
                        "_id name username email sex age image address phone government country level",
                    },
                  },
                ],
              },
              {
                path: "comments",
                model: "commentsLecture",
                populate: {
                  path: "student",
                  model: "User",
                  select:
                    "_id name username email sex age image address phone government country level",
                },
              },
            ],
          },
          {
            path: "quizzes",
            model: "Quiz",
            populate: {
              path: "quizItems",
              model: "quizItem",
            },
          },
        ],
      },
    ]);

    res.status(200).send({ status: 200, courses, success: true });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.getCourseComments = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.query.course }).populate({
      path: "comments",
      populate: {
        path: "student",
        model: "User",
      },
    });

    res.status(200).send({ status: 200, course, success: true });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.getCoursesRate = async (req, res) => {
  try {
    res.status(200).send({ status: 200, courses: req.courses, success: true });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.sendCourseToReview = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.query.course });

    if (course.owner.includes(req.user._id)) {
      course.review = true;
      await course.save();
      if (course.review) {
        res.status(200).send({
          status: 200,
          message: "Sent successfully, waiting for response",
          success: true,
        });
      } else {
        res
          .status(400)
          .send({ status: 400, message: "An error occurred", success: false });
      }
    } else {
      res.status(400).send({
        status: 400,
        message:
          "Unauthorized, Only owners are able to send course to review stage",
        success: false,
      });
    }
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.searchCourse = async (req, res) => {
  try {
    const course = await Course.find(req.query);

    if (course.length === 0) {
      throw { status: 204, message: "no content", success: false };
    }

    res.status(200).send({ status: 200, course, success: false });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.courseCertificate = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.query.course });
    const instructor = await User.findOne(course.owner[0]);
    const certificateExist = await Certificate.findOne({
      course: course._id,
      student: req.user._id,
    });
    if (certificateExist) {
      return res.send({
        status: 200,
        certificate: certificateExist,
        success: true,
      });
    } else {
      // create pdf
      const doc = await new PDFDocument({
        size: "A4",
        layout: "landscape",
      });
      // pdf output
      doc.pipe(
        fs.createWriteStream(
          `certificates/${checkName(req.user.name).join("-")}-certificate-${
            course.slug
          }-program-BetaAI.pdf`
        )
      );

      // certificate image
      doc.image(
        path.join(__dirname, "assets", "certificate", "certificate.png"),
        0,
        1,
        { width: 841, height: 594 }
      );

      // fixed text
      doc
        .font(path.join(__dirname, "assets", "fonts", "Lato-Regular.ttf"), 17.3)
        .text("This is to certify that", 70, 255, {
          align: "center",
          color: "#202020",
        });

      // student name
      doc
        .font(path.join(__dirname, "assets", "fonts", "Lato-Italic.ttf"), 28)
        .text(
          capitalizeWords(req.user.name.replace(/[^a-zA-Z ]/g, "").trim()),
          70,
          280,
          {
            align: "center",
            color: "#041438",
          }
        );

      // course name
      doc
        .font(path.join(__dirname, "assets", "fonts", "Lato-Regular.ttf"), 24)
        .text(`successfully completed ${course.title} program`, 67, 322, {
          align: "center",
          color: "#202020",
        });

      // instructor name
      doc
        .font(path.join(__dirname, "assets", "fonts", "ITCEDSCR.TTF"), 25)
        .text(capitalizeWords(checkName(instructor.name).join(" ")), 570, 420, {
          align: "center",
          color: "#041438",
        });

      // fixed text
      doc
        .font(path.join(__dirname, "assets", "fonts", "Lato-Medium.ttf"), 18)
        .text("Beta Instructor", 570, 448, {
          align: "center",
          color: "#202020",
        });
      // Course end date
      doc
        .font(path.join(__dirname, "assets", "fonts", "agency-fb.ttf"), 18)
        .text(moment(new Date()).format("DD/MM/YYYY"), 128, 448, {
          align: "left",
          color: "#202020",
        });

      // Finalize PDF file
      doc.end();

      setTimeout(async () => {
        const certificate = await new Certificate({
          student: req.user._id,
          course: course._id,
          // add pdf link from Cloudinary in certificate record
          certificate: await certificateLink(req, course),
        });

        await certificate.save();

        res.status(200).send({ status: 200, certificate, success: true });
      }, 1000);
    }
  } catch (e) {
    console.log(e);
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.getStudentCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id });
    if (certificates.length === 0) {
      res.status(200).send({
        status: 200,
        message: "no certificates to show",
        success: true,
      });
    } else {
      res.status(200).send({ status: 200, certificates, success: true });
    }
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.coursesPath = async (req, res) => {
  try {
    const courses = await Course.find();

    // set object to remove duplicates of path
    const path = [...new Set(courses.map((course) => course.path))];

    res.status(200).send({ status: 200, path, success: true });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

const capitalizeWords = (string) => {
  return string.replace(/(?:^|\s)\S/g, (a) => {
    return a.toUpperCase();
  });
};

const checkName = (instructorOrStudnet) => {
  const name = instructorOrStudnet
    .toLowerCase()
    .replace(/[^a-zA-Z ]/g, "")
    .trim()
    .split(" ");
  for (let i = 0; i < name.length; i++) {
    if (
      (name[0].includes("abd") || name[1].includes("abd")) &&
      !name[2].includes("abd")
    ) {
      return name.splice(0, 3);
    } else if (name[0].includes("abd") && name[2].includes("abd")) {
      return name.splice(0, 4);
    } else {
      return name.splice(0, 2);
    }
  }
};

// upload pdf certificate to Cloudinary
const certificateLink = async (req, course) => {
  // get description path
  const path = `certificates/${checkName(req.user.name).join(
    "-"
  )}-certificate-${course.slug}-program-BetaAI.pdf`;

  // upload description
  const certificate_description = await Cloudinary.uploader.upload(path, {
    public_id: `${checkName(req.user.name).join("-")}-certificate-${
      course.slug
    }-program-BetaAI_`,
  });

  // remove file from server after save in storage
  if (certificate_description) {
    fs.unlinkSync(path);
  }
  return certificate_description.secure_url;
};
