'use strict';

const config = require('./config.json')
const path = require('path')
const express = require('express')

const app = express()
const port = 3000;

// -----------------------------------------------------------------------------
// View engine setup
// -----------------------------------------------------------------------------
const preview_image_path = path.join(__dirname, 'preview')
const views_path = path.join(__dirname, 'views')
const components_path = require("path").join(views_path, "mjml_components")
const render_engine = require('./app/mjml.js')(components_path)

app.set('views', views_path);
app.engine('html', render_engine);
app.set('view engine', 'html');

// -----------------------------------------------------------------------------
// Public folder setup
// -----------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// Setup data source
// -----------------------------------------------------------------------------
const google_sheet = require('./app/google-sheet.js')(config.google_sheet, config.google_api_key, 5000)
//google_sheet.get_send_list().then(console.log);

// -----------------------------------------------------------------------------
// Setup email provider
// -----------------------------------------------------------------------------
const sendgrid = require('./app/sendgrid.js')(config.sendgrid_api_key)

// -----------------------------------------------------------------------------
// Setup headless chrome provider
// -----------------------------------------------------------------------------
const chrome = require('./app/headless-chrome.js')(preview_image_path)

// -----------------------------------------------------------------------------
// Routes setup
// -----------------------------------------------------------------------------
app.get('/', function(req, res, next) {
  google_sheet.get_send_list().then(data => {
    res.render('dashboard', { google_data: data });
  })
});

app.get('/send/all', function(req, res, next) {
  /*
  google_sheet.get_send_list().then(data => {
    sendgrid.send_all(data.send_list, (variation_data, cb) => {
      app.render(`email_templates/${variation_data.template_name}`, { data: variation_data }, cb);
    });
  });
  */

  res.send({ success: true, msg: "task has been queued, processing now..."});
});

app.get('/build/all/:width', function(req, res, next) {
  const width = JSON.parse(req.params.width);
  google_sheet.get_send_list().then(data => {
    chrome.get_all(data.send_list, (variation_data, cb) => {
      app.render(`email_templates/${variation_data.template_name}`, { data: variation_data }, cb);
    }, width);
  });

  res.send({ success: true, msg: "task has been queued, processing now..."});
});

app.get('/preview/:template/:variation/', function(req, res, next) {
  
  google_sheet.get_single(req.params.template, req.params.variation)
  .then(data => {
    console.log(data.hero_title);
    console.log(req.params.template)
    res.render(`email_templates/${req.params.template}`, { data: data });
  });
});

app.get('/send/:template/:variation/:email?', function(req, res, next) {
  google_sheet.get_single(req.params.template, req.params.variation)
  .then(data => {
    app.render(`email_templates/${req.params.template}`, { data }, (err, html) => {
      if (err) {
        console.log(err);
        res.send({success: false, err});
      } else {
        if (req.params.email) {
          data.recipient_email_address = req.params.email;
        }
        sendgrid.send_email(data, html);
        res.send({success: true});
      }
    });
  });
});

app.get('/img/:template/:variation/', function(req, res, next) {
  google_sheet.get_single(req.params.template, req.params.variation)
  .then(data => {
    app.render(`email_templates/${req.params.template}`, { data }, (err, html) => {
      if (err) {
        console.log(err);
        res.send({success: false, err});
      } else {
        chrome.get_preview_image(data, html, 700).then(filepath => {
          res.sendFile(filepath);
          //res.send({success: true, filepath });
        })
      }
    });
  });
});


// -----------------------------------------------------------------------------
// Run the server (listen for requests)
// -----------------------------------------------------------------------------
app.listen(port, () => console.log('Local dev app listening on port 3000!'))