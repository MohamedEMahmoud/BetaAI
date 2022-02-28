let compiler    = require('compilex');
let option      = {stats: true};
compiler.init(option);

exports.compilexCompiler = async (req, res) => {
    let code = req.body.code;
    let input = req.body.input;
    let withInputs = req.query.withInputs;
    let lang = req.query.lang;

    if (lang === "Python") {
        if (withInputs === "true") {
            let envData = {OS: "windows"};
            compiler.compilePythonWithInput(envData, code, input, function (data) {
                res.send({ status: 200, data: data.output, success: true });
                compiler.flush(function(){
                    console.log('All temporary files flushed !');
                });
            });
        } else {
            let envData = {OS: "windows"};
            compiler.compilePython(envData, code, function (data) {
                res.send({ status: 200, data: data.output, success: true });
                compiler.flush(function(){
                    console.log('All temporary files flushed !');
                });
            });
        }
    }
}