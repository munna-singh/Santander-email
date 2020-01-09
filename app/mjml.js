const mjml = require('mjml')
const ejs = require('ejs')
const mjml_core = require('mjml-core')
const path = require('path')

// Custom express view renderer (renders EJS then MJML, with support for custom MJML components)
module.exports = function(components_path) {

    return function(filePath, data, callback) {
        console.log(filePath);

        // Register custom MJML components
        require("fs").readdirSync(components_path)
            .forEach(function(file) {
                if (file && file.match(/\.js$/)) {
                    mjml_core.registerComponent(require(path.join(components_path,file)));
                }
            });

        // Render EJS template (first)
        ejs.renderFile(filePath, {filename:filePath, ...data}, { },
            function(err, template){
                if (err) {
                    console.error(err);
                    callback(err);
                }

                // Check if the file has any MJML code
                if (template.match(/<mjml>/i)) {
                    render_mjml(template, callback);
                } else {
                    callback(null, template);
                }
            }
        );
    };
}

function render_mjml(template, callback) {
    var mjmlResult;
    try {

        // Render MJML template (second)
        mjmlResult = mjml(template, { beautify: true, validationLevel: 'strict' });
    } catch (err) {
        if (err) {
            console.error(err);
            callback(err);
        }
    }

    if (mjmlResult.error) {
        console.error(mjmlResult.error);
        callback(mjmlResult.error);
    }

    if (mjmlResult) {
        callback(null, mjmlResult.html);
    } else {
        console.error("Something went wrong!");
        callback("Something went wrong!");
    }
}