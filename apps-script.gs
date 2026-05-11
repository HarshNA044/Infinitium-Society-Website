/**
 * Webhook script for Google Sheet registration and attendance.
 */
function doPost(e) {
  if (!e || !e.postData) {
    return ContentService.createTextOutput("Error: No data received").setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    var data = JSON.parse(e.postData.contents);
    console.log("Processing request: " + JSON.stringify(data));
    var sheetId = data.sheetId;
    if (!sheetId) {
      return ContentService.createTextOutput("Error: Missing sheetId");
    }
    
    var sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    if (data.type === 'attendance') {
      // Find row by ticketId and mark attendance
      var ticketId = data.ticketId;
      var range = sheet.getDataRange();
      var values = range.getValues();
      var ticketIdIndex = 13; // Column N (14th column, index 13)
      var attndIndex = 16;   // Column Q (17th column, index 16)

      for (var i = 1; i < values.length; i++) {
        if (values[i][ticketIdIndex] === ticketId) {
          sheet.getRange(i + 1, attndIndex + 1).setValue("Yes");
          return ContentService.createTextOutput("Attendance Marked");
        }
      }
      return ContentService.createTextOutput("Error: Ticket ID not found in sheet");
    } else {
      // Registration flow
      var timestamp = new Date();

      // Ensure headers exist if sheet is empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", "Student Name", "Roll No", "Email", "Phone No", "Course", "Year", 
          "College Name", "Is Part of Society", "Society Department", "Availability", 
          "Event ID", "Event Title", "Ticket ID", "Attended", "Created At", "Attendance Status"
        ]);
        sheet.getRange(1, 1, 1, 17).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      // Map fields from data to columns
      sheet.appendRow([
        timestamp,            // A: Timestamp
        data.studentName,      // B: studentName
        data.rollNo,           // C: rollNo
        data.email,            // D: email
        data.phoneNo,          // E: phoneNo
        data.course,           // F: course
        data.year,             // G: year
        data.collegeName,      // H: collegeName
        data.isPartOfSociety,  // I: isPartOfSociety
        data.societyDepartment,// J: societyDepartment
        data.availability,     // K: availability
        data.eventId,          // L: eventId
        data.eventTitle,       // M: eventTitle
        data.ticketId,         // N: ticketId
        data.attended,         // O: attended (bool)
        data.createdAt,        // P: createdAt (ISO string)
        "No"                   // Q: Attendance Status (Check-in status)
      ]);
      
      // Trigger Email
      try {
        sendRegistrationEmail(data);
      } catch (emailErr) {
        console.error("Failed to send email: " + emailErr.toString());
      }
      
      return ContentService.createTextOutput("Success");
    }
  } catch (err) {
    console.error("Script Error: " + err.toString());
    return ContentService.createTextOutput("Error: " + err.toString());
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
