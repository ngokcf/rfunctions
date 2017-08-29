// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
'use strict'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const rp = require('request-promise');
const crypto = require('crypto')
const secureCompare = require('secure-compare');
const express = require('express')
const exphbs = require('express-handlebars');
const app = express();

// express setting
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.get('/', (req, res) => {
   res.render('top', {});
});

// This HTTPS endpoint xxx
exports.app = functions.https.onRequest(app);

// Realtime Database Functions
exports.countComment = functions.database.ref('/comment/{commentid}/list').onWrite(event => {
  console.log(' Real time start Counter updated. ')
  const countRef = event.data.ref.parent.child('count');
  return event.data.ref.once('value')
      .then(data => countRef.set(data.numChildren()));
});

// Github and Slack Functions
exports.githubWebhook = functions.https.onRequest((req, res) => {
  console.log(' >>>>>>>>>>>>>>  ... GithubWebhook Funstions Called <<<<<<<<<<<<<<<<<< ')

  const cipher = 'sha1';
  const signature = req.headers['x-hub-signature'];

  const hmac = crypto.createHmac(cipher, functions.config().github.secret)
      .update(JSON.stringify(req.body, null, 0))
      .digest('hex');

  const expectedSignature = `${cipher}=${hmac}`;

  if (secureCompare(signature, expectedSignature)) {
    postToSlack(req.body.compare, req.body.commits.length, req.body.repository).then(() => {
      res.end();
    }).catch(error => {
      console.error(error);
      res.status(500).send('Something went wrong while posting the message to Slack.');
    });
  } else {
    console.error('x-hub-signature', signature, 'did not match', expectedSignature);
    res.status(403).send('Your x-hub-signature\'s bad and you should feel bad!');
  }
});

function postToSlack(url, commits, repo) {
  return rp({
    method: 'POST',
    uri: functions.config().slack.webhook_url,
    body: {
      text: `<${url}|${commits} new commit${commits > 1 ? 's' : ''}> pushed to <${repo.url}|${repo.full_name}>.`
    },
    json: true
  });
}

