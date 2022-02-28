const fs                = require('fs');
const { PythonShell }   = require('python-shell');

exports.pyShellCompiler = async (req, res) => {
    let code = req.body.code;
    let withInputs = req.body.withInputs;

    fs.writeFile('./temp/py_script.py', code, function (err) {
        if (err) throw err;

        let options = {
            mode: 'text',
            pythonOptions: ['-u'], // get print results in real-time
            scriptPath: "../temp",
            args: req.body.input
        };

        if (withInputs === "true") {
            let pyshell = new PythonShell('../temp/py_script.py');

            pyshell.send(JSON.stringify(req.body.input));

            pyshell.on('message', function (message) {
                return res.status(200).send({ status: 200, output: message, success: true });
            });

            pyshell.end(function (err, code, signal) {
                if (err) {
                    throw err;
                }
            });
        } else {
            PythonShell.run('py_script.py', options, function (err, results) {

                if (err) {
                    if (err.traceback.includes("input")) {
                        return res.status(422).send({
                            status: 422,
                            message: "You entered py-code that needs for input! please add withInputs = true",
                            success: false
                        });
                    }
                    return res.status(409).send({ status: 409, err, success: false });
                }
                res.status(200).send({ status: 200, output: results, success: true });
            });
        }

    });
}