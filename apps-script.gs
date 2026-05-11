/**
 * Webhook script for Google Sheet registration and attendance.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheetId = data.sheetId;
    if (!sheetId) {
      return ContentService.createTextOutput("Error: Missing sheetId");
    }
    
    var sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    if (data.type === 'attendance') {
      // Find row by ticketId
      var ticketId = data.ticketId;
      var range = sheet.getDataRange();
      var values = range.getValues();
      var ticketIdIndex = 13; // TicketId is 14th column (index 13)
      var attndIndex = 16; // attnd is 17th column (index 16)

      for (var i = 1; i < values.length; i++) {
        if (values[i][ticketIdIndex] === ticketId) {
          sheet.getRange(i + 1, attndIndex + 1).setValue("Yes");
          return ContentService.createTextOutput("Attendance Marked");
        }
      }
      return ContentService.createTextOutput("Error: Ticket not found");
    } else {
      // Registration flow
      var timestamp = new Date();
      
      // Columns: Timestamp, studentName, rollNo, email, phoneNo, course, year, collegeName, isPartOfSociety, societyDepartment, availability, eventId, eventTitle, ticketId, attended, createdAt, attnd
      sheet.appendRow([
        timestamp, // 1: Timestamp
        data.studentName, // 2
        data.rollNo, // 3
        data.email, // 4
        data.phoneNo, // 5
        data.course, // 6
        data.year, // 7
        data.collegeName, // 8
        data.isPartOfSociety, // 9
        data.societyDepartment, // 10
        data.availability, // 11
        data.eventId, // 12
        data.eventTitle, // 13
        data.ticketId, // 14
        data.attended, // 15
        data.createdAt, // 16
        "" // 17: attnd (initially blank or false/No)
      ]);
      
      // Send Email
      sendRegistrationEmail(data);
      
      return ContentService.createTextOutput("Success");
    }
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString());
  }
}

function sendRegistrationEmail(data) {
  var qrCodeUrl = "https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=" + encodeURIComponent(data.ticketId);
  var htmlBody = "<h1>Registration Confirmed</h1>" +
    "<p>Hello " + data.studentName + ",</p>" +
    "<p>You have successfully registered for <strong>" + data.eventTitle + "</strong>.</p>" +
    "<p><strong>Ticket ID:</strong> " + data.ticketId + "</p>" +
    "<p>Please show the QR code below at the event:</p>" +
    "<img src='" + qrCodeUrl + "' />" +
    "<p>Thank you!</p>";
    
  MailApp.sendEmail({
    to: data.email,
    subject: "Registration Success - " + data.eventTitle,
    htmlBody: htmlBody
  });
}
