// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

'use strict'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const express = require('express')
const exphbs = require('express-handlebars');
const app = express();

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
