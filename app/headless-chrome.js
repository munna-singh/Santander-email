const path = require('path')
const puppeteer = require('puppeteer')
const sleep = require('util').promisify(setTimeout)
const async_lib = require('async')

module.exports = function(output_path) {

    async function get_preview_image(data, html, width) {
        const { variation_name, template_name } = data;
        const filename = path.join(output_path, `${template_name}__${variation_name}.png`);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(html, {"waitUntil" : "networkidle0"});
        const override = Object.assign(page.viewport(), {width});
        await page.setViewport(override);

        await sleep(1000);
        await page.screenshot({ path: filename, fullPage: true  });
        await browser.close();

        return filename;
    } 

    async function get_all(data, get_html_fn, width) {
        var image_tasks = [];

        for (var template_name in data) {
            var template_data = data[template_name];

            for (var variation_name in template_data) {
                var variation_data = template_data[variation_name];

                ((d) => {
                    image_tasks.push((callback) => {
                        get_html_fn(d, (err, html) => {
                            if (err) {
                                console.error(err);
                                callback();
                            } else {
                                get_preview_image(d, html, width).then((filepath) => {
                                    console.log(`generated preview ${filepath}`);
                                    callback();
                                });
                            }
                        })
                    });
                })(variation_data);
            }
        }

        async_lib.parallelLimit(image_tasks, 1);
    }


    return {
        get_preview_image,
        get_all
    }
}