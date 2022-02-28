const { auth, compiler, fileValidation } = require(__dirname + "/../../middlewares"),
    multiCompilers = require(__dirname + "/compilex.compiler.controller");
//  {pyShellCompiler} = require(__dirname + "/py-shell.compiler.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "access-token, Origin, Content-Type, Accept, Access-Control-Allow-Origin"
        );
        next();
    });

    app.post('/cms/compiler', [auth.Jwt.verifyToken, compiler.state.obtainment, fileValidation.upload.none()], multiCompilers.compilexCompiler);

    // todo: enable Py-shell to work as emergency compiler
    // app.post("/compiler/py-shell", [auth.Jwt.verifyToken, fileValidation.upload.none()], pyShellCompiler)

}