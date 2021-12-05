const {
    auth,
    checkout,
    handleErrors,
    fileValidation,
    preValidation,
  } = require(__dirname + "/../../middlewares"),
  controller = require(__dirname + "/controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin"
    );
    res.header("Access-Control-Allow-Credentials", true);
    next();
  });

  app.post(
    "/auth/signup",
    fileValidation.upload.fields([{ name: "image", maxCount: 1 }]),
    fileValidation.validationPhoto,
    [
      preValidation.signUp,
      auth.verifySignUp.checkDuplicateUsernameOrEmail,
      auth.verifySignUp.emailAndPasswordValidation,
      auth.verifySignUp.checkRolesExisted,
      auth.secretCode.generate,
    ],
    controller.signUp,
    handleErrors
  );

  app.post(
    "/auth/login",
    [
      fileValidation.upload.none(),
      auth.secretCode.generate,
      auth.verifyHasAccess.confirmation,
      auth.verifyHasAccess.cancelBan,
    ],
    controller.signIn
  );

  app.post(
    "/auth/logout",
    [auth.Jwt.verifyToken, fileValidation.upload.none()],
    controller.signOut
  );

  app.patch(
    "/auth/user",
    [
      auth.Jwt.verifyToken,
      fileValidation.upload.fields([{ name: "image", maxCount: 1 }]),
      fileValidation.validationPhoto,
      auth.verifyUpdate.checkForUpdateOverWrite, // DO NOT CHANGE THIS MIDDLEWARE ORDER!
    ],
    controller.updateProfile,
    handleErrors
  );

  app.delete("/auth/user", [auth.Jwt.verifyToken], controller.deleteProfile);

  app.get(
    "/auth/user",
    [auth.Jwt.verifyToken, checkout.verifyPlan.endIn_Plan],
    controller.getUserData
  );

  // Login with google
  app.post(
    "/auth/google",
    [fileValidation.upload.none()],
    controller.googleLogin
  );

  //Activation Code with query 'activate'
  app.patch(
    "/auth/activation",
    [fileValidation.upload.none()],
    controller.activation
  );

  // forgotten password
  app.post(
    "/auth/forgotten/password",
    [fileValidation.upload.none()],
    controller.forgottenPassword,
    handleErrors
  );

  // reset password
  app.patch(
    "/auth/reset/password",
    [fileValidation.upload.none(), auth.secretCode.decryption],
    controller.resetPassword
  );
};
