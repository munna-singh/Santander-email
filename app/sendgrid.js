const sgMail = require('@sendgrid/mail');
const async_lib = require('async');
const fetch = require('node-fetch');
const fs = require('fs');

module.exports = function(sendgrid_api_key) {
    sgMail.setApiKey(sendgrid_api_key);

    async function replace_images_with_cid(html) {
        const images = html.match(/http[A-z0-9_\-.:\/]+.png|http[A-z0-9_\-.:\/]+.gif/gi);

        const result = [];
        let image_id = 0;
        for (image of images) {
            const res = await fetch(image);
            const buf = await res.buffer();
            const base64 = buf.toString('base64');

            const filename = image.match(/[A-z0-9_\-.]+.png|[A-z0-9_\-.]+.gif/gi)[0];
            const filetype = filename.match(/png|gif/gi)[0];
            const cid_name = `image${image_id++}`;
            const filepath = `./build/images/${filename}`;

            fs.writeFileSync(filepath, buf);

            result.push({
                filename,
                contentType: `image/${filetype}`,
                disposition:"inline",
                content_id: cid_name,
                content: base64
            });
            
            html = html.replace(image, `cid:${cid_name}`);
        }
        
        return { cid_data:result, cid_html: html };
    }

    async function send_email(variation_data, html) {

        /*
        const { cid_data, cid_html } = await replace_images_with_cid(html);
        
        variation_data.sender_name = "Calvin Lai";
        variation_data.recipient_email_address = "calvin.lai@galepartners.com"

        */

        const msg = {
            to: variation_data.recipient_email_address,
            from: `${variation_data.sender_name} <${variation_data.sender_email_address}>`,
            subject: variation_data.subject_line,
            text: variation_data.preview_text,
            //attachments: cid_data,
            //html: cid_html,
            html
        };

        console.log(JSON.stringify({
            id: variation_data.variation_name,
            to: msg.to,
            from: msg.from,
            subject: msg.subject,
            text: msg.text,
        }))

        try {
            const [res, body] = await sgMail.send(msg);
            console.log(`scheduled: ${msg.to}, response: ${res.statusCode}`);
        }catch(error) {
            console.log(JSON.stringify(error));
        }
    }


    async function send_all(data, get_html_fn) {
        var send_tasks = [];

        for (var template_name in data) {
            var template_data = data[template_name];

            for (var variation_name in template_data) {
                var variation_data = template_data[variation_name];

                ((d) => {
                    send_tasks.push((callback) => {
                        get_html_fn(d, (err, html) => {
                            if (err) {
                                console.error(err);
                                callback();
                            } else {
                                send_email(d, html).then(() => {
                                    callback();
                                });
                            }
                        })
                    });
                })(variation_data);
            }
        }

        async_lib.parallelLimit(send_tasks, 1);
    }

    return {
        send_email,
        send_all
    }
};