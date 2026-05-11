/**
 * Webhook script for Google Sheet registration and attendance.
 */
function doPost(e) {
  // CORS Preflight
  if (e.parameter && e.parameter.method === 'OPTIONS') {
    return ContentService.createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  try {
    var data = JSON.parse(e.postData.contents);
    console.log("Received data: " + JSON.stringify(data));
    var sheetId = data.sheetId;
    if (!sheetId) {
      return ContentService.createTextOutput("Error: Missing sheetId")
        .setHeader("Access-Control-Allow-Origin", "*");
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
          return ContentService.createTextOutput("Attendance Marked")
            .setHeader("Access-Control-Allow-Origin", "*");
        }
      }
      return ContentService.createTextOutput("Error: Ticket not found")
        .setHeader("Access-Control-Allow-Origin", "*");
    } else {
      // Registration flow
      var timestamp = new Date();

      // Ensure headers exist
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", "Student Name", "Roll No", "Email", "Phone No", "Course", "Year", 
          "College Name", "Is Part of Society", "Society Department", "Availability", 
          "Event ID", "Event Title", "Ticket ID", "Attended", "Created At", "Attendance"
        ]);
        sheet.getRange(1, 1, 1, 17).setFontWeight("bold");
      }
      
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
      try {
        sendRegistrationEmail(data);
      } catch (emailErr) {
        console.error("Email error: " + emailErr.toString());
      }
      
      return ContentService.createTextOutput("Success")
        .setHeader("Access-Control-Allow-Origin", "*");
    }
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString())
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function sendRegistrationEmail(data) {
  try {
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
    console.log("Email sent successfully to " + data.email);
  } catch (e) {
    console.error("Failed to send email to " + data.email + ": " + e.toString());
    throw e; // Rethrow to catch it in doPost
  }
}
