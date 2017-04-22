'use strict';
var restify = require('restify');
var botbuilder = require('botbuilder');

var kPort = process.env.PORT || 4000;
var kBotID = process.env.MS_APP_ID;
var kAppPW = process.env.MS_APP_PASSWORD;
var isLocal = process.env.IS_LOCAL;

var gs = require('google-spreadsheet');
var spreadsheetID = process.env.GOOGLE_SPREADSHEET_ID;

var spreadsheet = new gs(spreadsheetID);

function spreadsheetInfo( spreadsheet ) {
  return new Promise( function (resolve, reject) {
    spreadsheet.getInfo( function( err,info) {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      };
    });
  });
}

function getSpreadsheetRows( spreadsheet ) {
  return new Promise( function( resolve, reject) {
    spreadsheet.getRows( function _getRows( err, rows) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function decodeTruth( t ) {
  return {
    question: t.content,
    active: t.active.toLowerCase() === 'true',
    intensity: parseFloat(t.intensity || 0)
  };
}

function decodeDare( d ) {
  return {
    question: d.content,
    active: d.active.toLowerCase() === 'true',
    intensity: parseFloat(d.intensity || 0)
  };
}

function getSpreadsheetData( info ) {  
  return new Promise( function( resolve, reject) {
    var truthSpreadsheet = info.worksheets.find( (ws)=>{ return ws.title === 'truth'});
    var dareSpreadsheet = info.worksheets.find( (ws)=>{ return ws.title === 'dare'});

    if (!truthSpreadsheet) { reject('Unable to get truth spreadsheet'); return; }
    if (!dareSpreadsheet) { reject('Unable to get dare spreadsheet'); return; }

    Promise.all( [getSpreadsheetRows(truthSpreadsheet), getSpreadsheetRows(dareSpreadsheet)] )
    .then( (sheets)=>{
      resolve( {truth: sheets[0].map(decodeTruth),
                dare: sheets[1].map(decodeDare)});
    })
    .catch( (err)=>reject(err));
  });
}


function getData(){
  return new Promise( function (resolve, reject) {
    spreadsheetInfo( spreadsheet )
    .then( getSpreadsheetData )
    .then( (data) => {resolve(data)})
    .catch( (err)=>reject(err));
  });
}

var endpoint = (isLocal)? (new botbuilder.ConsoleConnector()) : new botbuilder.ChatConnector( { appId: kBotID, appPassword: kAppPW});
var bot = new botbuilder.UniversalBot(endpoint);

bot.dialog('/truth', (session,args,next)=>{
  session.send('truth!');
  next();
});
bot.dialog('/dare', (session,args,next)=>{
  session.send('dare!');
  next();
});

bot.dialog('/', [
    (session)=>{
      var dir = Math.random();
      console.log(dir);
      session.beginDialog( (dir>0.5) ? '/truth' : '/dare' );
    }
]);


if (isLocal) {
  endpoint.listen();
} else {
  var server = restify.createServer();
  server.get('/heartbeat', (req,res,next)=>{ res.send(200); next(); });
  server.post('/messages', endpoint.listen());
  server.listen(kPort, ()=>{console.log(`${server.name} listening to ${server.url}`)});
}



