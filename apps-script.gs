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
      
      // Better header detection: check if first row is actually headers
      var lastRow = sheet.getLastRow();
      var firstRowValues = lastRow > 0 ? sheet.getRange(1, 1, 1, 17).getValues()[0] : [];
      var hasHeaders = firstRowValues[0] === "Timestamp" || firstRowValues[0] === "timestamp";

      if (!hasHeaders) {
        // If sheet has content but no headers, insert at top or just append if empty
        if (lastRow === 0) {
          sheet.appendRow([
            "Timestamp", "Student Name", "Roll No", "Email", "Phone No", "Course", "Year", 
            "College Name", "Is Part of Society", "Society Department", "Availability", 
            "Event ID", "Event Title", "Ticket ID", "Attended", "Created At", "Attendance Status"
          ]);
        } else {
          sheet.insertRowBefore(1);
          sheet.getRange(1, 1, 1, 17).setValues([[
            "Timestamp", "Student Name", "Roll No", "Email", "Phone No", "Course", "Year", 
            "College Name", "Is Part of Society", "Society Department", "Availability", 
            "Event ID", "Event Title", "Ticket ID", "Attended", "Created At", "Attendance Status"
          ]]);
        }
        sheet.getRange(1, 1, 1, 17).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      console.log("Appending registration data for: " + (data.studentName || "Unknown"));
      
      // Explicit mapping to ensure even if some fields are missing in data, we maintain column structure
      var rowData = [
        timestamp,                          // A: Timestamp
        data.studentName || "",             // B
        data.rollNo || "",                  // C
        data.email || "",                   // D
        data.phoneNo || data.phone || "",    // E (Support both keys just in case)
        data.course || "",                  // F
        data.year || "",                    // G
        data.collegeName || data.college || "", // H
        data.isPartOfSociety || "",         // I
        data.societyDepartment || "",       // J
        data.availability || "",            // K
        data.eventId || "",                 // L
        data.eventTitle || "",              // M
        data.ticketId || "",                // N
        data.attended || false,             // O
        data.createdAt || "",               // P
        "No"                                // Q: Attendance Status
      ];
      
      sheet.appendRow(rowData);
      
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
