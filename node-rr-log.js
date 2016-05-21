// Required node modules
var http              = require('http'),
    url               = require('url'),
    GoogleSpreadsheet = require('google-spreadsheet');;

// Listen port
const PORT=8080;

// Configuration and authentication information
var config = require('./config.json');

// Ticket URL
var ticketURLPrefix = config.ticket_url;

// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet(config.spreadsheet_id);
var sheet, worksheetRows;

// Row index counter
var rowIndex = 0;

// Request handler
function handleRequest(request, response) {
    console.log('Request received: ' + request.url);
    var query = url.parse(request.url, true).query;
    var queryJsonString = JSON.stringify(query);
    var ticketData = JSON.parse(queryJsonString);
    console.log(queryJsonString);

    // the row is an object with keys set by the column headers
    worksheetRows[rowIndex].Agent = ticketData.assignee;
    var assignedTicketURL = ticketURLPrefix + ticketData.id;
    worksheetRows[rowIndex].TicketNumber = assignedTicketURL;
    worksheetRows[rowIndex].save(); // this is async
    rowIndex++;
}

function loadWorksheetRows() {
    // google provides some query options
    sheet.getRows({
      offset: 1,
      limit: 400,
    }, function(err, rows) {
      console.log('Read ' + rows.length + ' rows');
      worksheetRows = rows;
    });
}

// Callback for doc metadata
function getInfoAndWorksheets() {
    doc.getInfo(function(err, info) {
        console.log('Loaded doc: ' + info.title+' by ' + info.author.email);
        // Worksheet 1 is the RR assignments log
        sheet = info.worksheets[1];
        console.log('sheet 1: ' + sheet.title+' ' + sheet.rowCount +'x' + sheet.colCount);
        loadWorksheetRows();
    });
}

// Callback for doc authentication
function googleAuthCallback() {
    console.log("Authenticated with Google Docs...");
    getInfoAndWorksheets();
}

// Instantiate server
var server = http.createServer(handleRequest);

// Start Listening
server.listen(PORT, function() {
    // Successfully started listening
    console.log("Server listening on: http://localhost:%s", PORT);
    doc.useServiceAccountAuth(config, googleAuthCallback);
});