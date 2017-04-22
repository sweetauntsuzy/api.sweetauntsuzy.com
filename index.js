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

spreadsheetInfo( spreadsheet )
.then( getSpreadsheetData )
.then( (data) => {
  console.log(data);
})
.catch( function(err) {
  console.error('Unable to get spreadsheet info: ', err.toString());
});
