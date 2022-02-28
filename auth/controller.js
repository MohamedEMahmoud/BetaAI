const db = require(__dirname + "/../../models"),
  User = db.user,
  Role = db.role,
  Account = db.account,
  CardInstructor = db.cardInstructor,
  Chat = db.chat,
  bcrypt = require("bcryptjs"),
  _ = require("lodash"),
  { OAuth2Client } = require("google-auth-library"),
  stripe = require("stripe")(process.env.SECRET_STRIPE_KEY),
  jwt = require("jsonwebtoken"),
  nodemailer = require("nodemailer"),
  Cloudinary = require("cloudinary").v2,
  fs = require("fs"),
  address = require("address"),
  crypto = require("crypto");

exports.signUp = async (req, res) => {
  try {
    const user = await new User({ ...req.body });

    if (req.files.image) {
      // get image path
      const path = req.files.image[0].path;

      // upload image
      const cloudinary = await Cloudinary.uploader.upload(path, {
        public_id: `profile-images/beta-ai-${
          req.body.username
        }-${new Date().toISOString()}`,
        use_filename: true,
        tags: `profile, ${req.body.name}, ${req.body.username}, ${req.body.year}`,
        width: 500,
        height: 500,
        crop: "scale",
        placeholder: true,
      });

      user.image = cloudinary.secure_url;

      if (cloudinary) {
        fs.unlinkSync(path);
      }
    }

    if (req.body.day || req.body.month || req.body.year) {
      if (!req.body.day || !req.body.month || !req.body.year) {
        throw { status: 422, message: "Invalid birthday", success: false };
      }

      // calc age
      const age = {
        day: req.body.day,
        month: req.body.month,
        year: req.body.year,
      };

      if (typeof age === "object") {
        if (age) {
          const { day, month, year } = age;
          const calculate_age = (dob) => {
            let diff_ms = Date.now() - dob.getTime();
            let age_dt = new Date(diff_ms);

            return Math.abs(age_dt.getUTCFullYear() - 1970);
          };
          if (calculate_age(new Date(year, month, day)) <= 13) {
            throw { status: 400, message: "your underage", success: false };
          }

          user.age = calculate_age(new Date(year, month, day));
        }
        if (typeof user.age !== "number") {
          throw {
            status: 400,
            message: "please enter birthday",
            success: false,
          };
        }
      }
    }

    // // check for recruiter role
    // if (req.body.role && req.body.role === "recruiter") {
    //     const role = await Role.findOne({ name: "recruiter" });
    //     user.roles = [role._id];
    // } else {
    //     // if not recruiter make him user
    //     if (req.body.roles) {
    //         await Role.find({ name: { $in: req.body.roles } },
    //             roles => user.roles = roles.map(role => role._id)
    //         )
    //     } else {
    //         const role = await Role.findOne({ name: "user" })
    //         user.roles = [role._id]
    //     }
    // }

    if (req.body.role) {
      const roles = await Role.find({ name: { $in: req.body.role } });
      user.roles = [...roles.map((role) => role._id)];
    } else {
      const role = await Role.findOne({ name: "user" });
      user.roles = [role._id];
    }
    if (user) {
      user.secretCode = { ...req.secretCode };
      const token = await user.generateAuthToken();
      const addr = {
        IP: address.ip(),
        IPV6: address.ipv6(),
        MAC: address.mac((err, addr) => {
          if (err) {
            throw {
              status: 400,
              message: "Can not reach to MAC Address",
              success: false,
            };
          } else {
            return addr;
          }
        }),
      };
      user.address = [...user.address, addr];

      const client = await new OAuth2Client(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );
      client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
      const accessToken = await client.getAccessToken();

      let transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: process.env.MAIL_SERVER_PORT,
        secure: true,
        auth: nodemailerAccessTokenIsExpired(accessToken) ,
        tls: {
          rejectUnauthorized: true,
        },
      });

      const message = {
        from: '"BetaAI Support" <no-reply@beta.ai>',
        to: req.body.email,
        subject: "BetaAI Support",
        html: `
                    <div style="text-align: center;  font-family: sans-serif">
                        <img src="https://i.ibb.co/fCrSpsF/logo.jpg" alt="Beta AI" style="width: 250px">

                        <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                            <h1 style="direction: ltr">Just one more step...</h1>

                            <h2>${req.body.name}</h2>

                            <p style="font-size: 16px">
                              CLick the big button below to activate your BetaAI account
                            </p>

                            <a style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold" href=${process.env.ClIENT_URL}/activate/${token}>Activate Account</a>
                        </div>

                        <div style="margin: 20px; background: transparent; color: #041438">
                            <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                                <a  style="color: #041438; text-transform: uppercase;" href=${process.env.SERVER_URL}/help target="_blank">contact us</a>
                            </p>
                            <p style="margin: 20px 0; direction: ltr">&copy; 2020 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                      </div>

                `,
      };

      transport.verify((error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("server is ready to send email");
        }
      });

      transport.sendMail(message, async (error, body) => {
        if (error) {
          console.log(error);
          throw {
            status: 500,
            message:
              error.message ||
              "Account was created but the activation email not sent",
            success: false,
          };
        } else {
          //   add admins as friend to user and opposite
          const role = await Role.findOne({ name: "admin" });
          const admins = await User.find({ roles: role._id });
          if (!req.body.role.includes("admin")) {
            const chat = await new Chat({
              sender: [...admins.map((admin) => admin._id)],
              receiver: user._id,
            });
            user.chats = [
              { friend: admins.map((admin) => admin._id), chat: chat._id },
            ];
            admins.map(async (admin) => {
              admin.chats = [{ friend: user._id, chat: chat._id }];
              await admin.save();
            });
            await chat.save();
          }
          await user.save();
          console.log(`Email Sent ${body.response}`);
          res
            .status(200)
            .cookie("token", user.tokens[0].token, configCookie(req))
            .send({
              status: 200,
              user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                age: user.age,
                sex: user.sex,
                plan: user.plan,
                activate: user.activate,
                activationCode: user.activationCode,
                website: user.website,
                about: user.about,
                phone: user.phone,
                photo: user.image
                  ? user.image
                  : user.sex
                  ? user.sex === "male"
                    ? "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg"
                    : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-female_cun4gc.jpg"
                  : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg",
                token: token,
              },
              success: true,
            });
        }
      });
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

exports.signIn = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).populate(
      "roles",
      "-__v"
    );

    if (!user) {
      throw { status: 404, message: "User is not defined", success: false };
    }

    let authorities = [];
    for (let i = 0; i < user.roles.length; i++) {
      authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
    }

    let passwordIsValid = await bcrypt.compareSync(
      req.body.password,
      user.password
    );

    let token = [];
    if (passwordIsValid) {
      user.tokens.length === 1 ? null : (token = user.generateAuthToken());
    } else {
      throw {
        status: 422,
        accessToken: null,
        message: "Invalid Password!",
        success: false,
      };
    }

    const addr = {
      IP: address.ip(),
      IPV6: address.ipv6(),
      MAC: address.mac((e, addr) => {
        if (e) {
          throw {
            status: 400,
            message: "Can not reach to MAC Address",
            success: false,
          };
        } else {
          return addr;
        }
      }),
    };

    if (!user.address.map((addr) => addr.MAC).includes(addr.MAC)) {
      user.address = [...user.address, addr];
    }

    user.secretCode = { ...req.secretCode };
    user.isOnline = true;
    await user.save();

    res
      .status(200)
      .cookie("token", user.tokens[0].token, configCookie(req))
      .send({
        status: 200,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          age: user.age,
          sex: user.sex,
          phone: user.phone,
          photo: user.image
            ? user.image
            : user.sex
            ? user.sex === "male"
              ? "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg"
              : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-female_cun4gc.jpg"
            : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg",
          roles: authorities,
          website: user.website,
          about: user.about,
          active: user.active,
          token: user.tokens[user.tokens.length - 1].token || token,
        },
        success: true,
      });
  } catch (e) {
    console.log(e);
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.signOut = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    req.user.isOnline = false;

    await req.user.save();
    res.status(200).send({ status: 200, success: true });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.body.email) {
      const accounts = await stripe.accounts.list({ limit: 100 });
      const customers = await stripe.customers.list({ limit: 100 });
      const customerExist = customers.data.map((customer) =>
        customer.email === req.user.email ? true : false
      );
      const accountExist = accounts.data.map((account) =>
        account.email === req.user.email ? true : false
      );
      const instructorBankAccount = await Account.findOne({
        instructor: req.user.id,
      });
      const instructorCard = await CardInstructor.findOne({
        instructor: req.user.id,
      });

      if (customerExist.includes(true)) {
        await stripe.customers.update(
          customers.data
            .filter((customer) => customer.email === req.user.email)
            .map((customer) => customer.id)
            .toString(),
          {
            email: req.body.email,
          }
        );
      }
      // if (accountExist.includes(true)) {
      //     await stripe.accounts.update(
      //         accounts.data.filter(account => account.email === req.user.email).map(account => account.id).toString(),
      //         {
      // https://dashboard.stripe.com/express/oauth/authorize?response_type=code&client_id=ca_IlX5TWMttNxyjwSWphadFRYPygSiAxms&scope=read_write
      //             account_token: instructorBankAccount ? instructorBankAccount.token.map(t => t.id)[0] : instructorCard.token.map(t => t.id)[0],
      //             email: req.body.email
      //         }
      //     );
      // }
    }
    req.user = _.extend(req.user, req.body);
    if (req.files.image) {
      // get image path
      const path = req.files.image[0].path;

      // upload image
      const cloudinary = await Cloudinary.uploader.upload(path, {
        public_id: `profile-images/beta-ai-${
          req.body.username || req.user.username
        }-${new Date().toISOString()}`,
        use_filename: true,
        tags: `profile, ${req.user.name}, ${
          req.body.username || req.user.username
        }, ${req.user.year}`,
        width: 500,
        height: 500,
        crop: "scale",
        placeholder: true,
      });

      req.user.image = cloudinary.secure_url;

      if (cloudinary) {
        fs.unlinkSync(path);
      }
    }

    req.user.updatedAt = Date.now();
    await req.user.save();

    res.send({ status: 202, user: req.user, success: true });
  } catch (e) {
    console.log(e);
    if (e.message.includes("email")) {
      e.message = "Email exists";
      e.status = 409;
    }

    if (e.message.includes("username")) {
      e.message = "Username exists";
      e.status = 409;
    }

    if (
      e.message.includes(
        "Path `age` (12) is less than minimum allowed value (13)."
      )
    ) {
      e.message = "age should be more than 13";
      e.status = 400;
    }
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    await req.user.remove();

    res.status(204);
  } catch (e) {
    console.log(e);
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

//Login with google
exports.googleLogin = async (req, res) => {
  try {
    const client = await new OAuth2Client(process.env.CLIENT_ID);

    const { tokenId } = req.body;

    const response = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.CLIENT_ID,
    });

    const { email_verified, email, name, picture } = response.payload;

    if (email_verified) {
      const user = await User.findOne({ email });
      const role = await Role.findOne({ name: "user" });

      if (user) {
        if (!user.active || user.activationCode) {
          throw {
            status: 400,
            message: "Email is already in use!",
            success: false,
          };
        }

        user.tokens.length === 1 ? null : user.generateAuthToken();

        res.send({ status: 200, user, success: true });
      }

      if (!user) {
        let data = {
          name,
          username: email.replace(/@[^:^]*/, ""),
          email,
          password: email + process.env.SECRET,
          roles: [role._id],
          photo: picture,
          active: true,
        };

        const newUser = await new User({ ...data });

        newUser.generateAuthToken();

        res.send({
          status: 200,
          user: {
            active: newUser.active,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            age: newUser.age,
            photo: newUser.photo,
            roles: newUser.roles,
            token: newUser.tokens[newUser.tokens.length - 1].token,
          },
          success: true,
        });
      }
    }
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.activation = async (req, res) => {
  try {
    const token = req.query.activate;

    const decoded = jwt.verify(token, process.env.SECRET);

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

    const IV_LENGTH = 16;

    if (user) {
      user.active = true;
      let iv = crypto.randomBytes(IV_LENGTH);
      let cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY),
        iv
      );
      let encrypted = cipher.update("user");
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      user.activationCode = encrypted;

      await user.save();
    } else {
      throw {
        status: 400,
        message: "User does not exist or account was already activated",
        success: false,
      };
    }

    res.send({
      status: 200,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        age: user.age,
        sex: user.sex,
        phone: user.phone,
        photo: user.image
          ? user.image
          : user.sex
          ? user.sex === "male"
            ? "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg"
            : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-female_cun4gc.jpg"
          : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg",
        website: user.website,
        about: user.about,
        active: user.active,
        token: user.tokens[user.tokens.length - 1].token || token,
      },
      success: true,
    });
  } catch (e) {
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.getUserData = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id }).populate(
      "roles",
      "_id name"
    );

    res.status(200).send({
      status: 200,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        age: user.age,
        sex: user.sex,
        phone: user.phone,
        photo: user.image
          ? user.image
          : user.sex
          ? user.sex === "male"
            ? "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg"
            : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-female_cun4gc.jpg"
          : "https://res.cloudinary.com/beta-ai/image/upload/v1614080814/Platform%20Assets/beta-ai-male_ubwwwm.jpg",
        website: user.website,
        about: user.about,
        active: user.active,
        validPlan: req.user.stillOpen,
        token: user.tokens[user.tokens.length - 1].token,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      success: true,
    });
  } catch (e) {
    console.log(e);
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

exports.forgottenPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const client = await new OAuth2Client(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );
      client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
      const accessToken = await client.getAccessToken();

      let transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: process.env.MAIL_SERVER_PORT,
        secure: true,
        auth: {
          type: "OAuth2",
          user: process.env.MAIL_USER,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });

      const message = {
        from: '"BetaAI Support" <no-reply@beta.ai>',
        to: user.email,
        subject: "BetaAI Support",
        html: `
                <div style="text-align: center;  font-family: sans-serif">
                    <img src="https://i.ibb.co/fCrSpsF/logo.jpg" alt="Beta AI" style="width: 250px">

                    <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">

                        <h2>${user.name}</h2>

                        <p style="font-size: 16px">
                          CLick the big button below to reset your password
                        </p>

                        <a style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold" href=${process.env.ClIENT_URL}/account/reset?code=${user.secretCode.iv}-${user.secretCode.content}>Reset Password</a>
                    </div>

                    <div style="margin: 20px; background: transparent; color: #041438">
                        <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                            <a  style="color: #041438; text-transform: uppercase;" href=${process.env.SERVER_URL}/help target="_blank">contact us</a>
                        </p>
                        <p style="margin: 20px 0; direction: ltr">&copy; 2020 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                  </div>

            `,
      };

      transport.verify((error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("server is ready to send email");
        }
      });

      transport.sendMail(message, (error, body) => {
        if (error) {
          console.log(error);
          throw {
            status: 500,
            message:
              error.message || "email message about forgot Password not sent",
            success: false,
          };
        } else {
          console.log(`Email Sent ${body.response}`);

          res
            .status(200)
            .send({ status: 200, user, message: "Email Sent", success: true });
        }
      });
    } else {
      throw { status: 400, message: "invalid email", success: false };
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

exports.resetPassword = async (req, res) => {
  try {
    if (req.body.password) {
      let isTheSamePassword = await bcrypt.compareSync(
        req.body.password,
        req.user.password
      );

      if (isTheSamePassword) {
        throw {
          status: 409,
          message: "Can not change password with the previous one",
          success: false,
        };
      }
    }

    req.user = _.extend(req.user, req.body);
    req.user.updatedAt = Date.now();
    await req.user.save();
    res.status(200).send({
      status: 200,
      user: req.user,
      message: "success reset password",
      success: true,
    });
  } catch (e) {
    console.log(e);
    res.status(e.status || 500).send({
      status: e.status || 500,
      message: e.message || "Server is not ready now",
      success: false,
    });
  }
};

const nodemailerAccessTokenIsExpired = (accessToken) => {
  if ( new Date() > new Date(accessToken.res.data.expiry_date)) {
    return{
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    }
  }
  else{
    return{
        type: "OAuth2",
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
    }
  }
};
const configCookie = (req) => {
  return {
    path: req.originalUrl,
    // You can't access these tokens in the client's javascript
    httpOnly: true,
    // set NODE_ENV = production in env file when using https to force secure true
    secure: process.env.NODE_ENV === "production" ? true : false,
    /** NOTE: 1 x 10^9 indicates to 1 day **/
    expires: new Date(Date.now() + 3000000000),
    // maxAge: 24 * 60 * 60 * 30,
    // domain: process.env.ClIENT_URL, // write clientSide domain
    // signed: true
    // sameSite: Boolean or String :
  };
};
