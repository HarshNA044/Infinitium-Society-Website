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
      var ticketIdIndex = 14; // Column O (15th column, index 14)
      var attndIndex = 17;   // Column R (18th column, index 17)

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
      var firstRowValues = lastRow > 0 ? sheet.getRange(1, 1, 1, 18).getValues()[0] : [];
      var hasHeaders = firstRowValues[0] === "Timestamp" || firstRowValues[0] === "timestamp";

      if (!hasHeaders) {
        // If sheet has content but no headers, insert at top or just append if empty
        if (lastRow === 0) {
          sheet.appendRow([
            "Timestamp", "Student Name", "Roll No", "Email", "Phone No", "Course", "Other Course", "Year", 
            "College Name", "Is Part of Society", "Society Department", "Availability", 
            "Event ID", "Event Title", "Ticket ID", "Attended", "Created At", "Attendance Status"
          ]);
        } else {
          sheet.insertRowBefore(1);
          sheet.getRange(1, 1, 1, 18).setValues([[
            "Timestamp", "Student Name", "Roll No", "Email", "Phone No", "Course", "Other Course", "Year", 
            "College Name", "Is Part of Society", "Society Department", "Availability", 
            "Event ID", "Event Title", "Ticket ID", "Attended", "Created At", "Attendance Status"
          ]]);
        }
        sheet.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      console.log("Appending registration data for: " + (data.studentName || "Unknown"));
      
      // Explicit mapping to ensure even if some fields are missing in data, we maintain column structure
      var rowData = [
        timestamp,                          // A: Timestamp
        data.studentName || "",             // B
        data.rollNo || "",                  // C
        data.email || "",                   // D
        data.phoneNo || data.phone || "",    // E
        data.course || "",                  // F
        data.otherCourse || "",             // G: Other Course
        data.year || "",                    // H
        data.collegeName || data.college || "", // I
        data.isPartOfSociety || "",         // J
        data.societyDepartment || "",       // K
        data.availability || "",            // L
        data.eventId || "",                 // M
        data.eventTitle || "",              // N
        data.ticketId || "",                // O
        data.attended || false,             // P
        data.createdAt || "",               // Q
        "No"                                // R: Attendance Status
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
    
    // Create HTML for PDF
    var pdfHtml = '<html><body style="font-family: sans-serif; padding: 40px; border: 1px solid #eee;">' +
                  '<div style="text-align: center; background-color: #1e3a8a; color: white; padding: 20px; margin-bottom: 20px;">' +
                  '<h1 style="margin: 0;">ADGITM EVENT TICKET</h1>' +
                  '</div>' +
                  '<div style="text-align: center;">' +
                  '<h2 style="color: #1e3a8a;">' + (data.eventTitle || "Event Registration") + '</h2>' +
                  '<p style="font-size: 18px;"><b>Ticket ID:</b> ' + data.ticketId + '</p>' +
                  '</div>' +
                  '<hr style="border: 0; border-top: 1px dashed #ccc; margin: 20px 0;"/>' +
                  '<div style="margin-left: 20px;">' +
                  '<p><b>Name:</b> ' + data.studentName + '</p>' +
                  '<p><b>Roll No:</b> ' + data.rollNo + '</p>' +
                  '<p><b>Email:</b> ' + data.email + '</p>' +
                  '</div>' +
                  '<div style="text-align: center; margin-top: 30px;">' +
                  '<img src="' + qrCodeUrl + '" width="200" height="200" />' +
                  '<p style="font-size: 12px; color: #666;">Scan this QR at the venue</p>' +
                  '</div>' +
                  '<div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999;">' +
                  '<p>© 2024 ADGITM Society. Generated automatically.</p>' +
                  '</div>' +
                  '</body></html>';

    var blob = HtmlService.createHtmlOutput(pdfHtml).getAs('application/pdf');
    blob.setName("Ticket_" + data.ticketId + ".pdf");

    var body = "<h1>Registration Successful</h1>" +
               "<p>Hello " + data.studentName + ",</p>" +
               "<p>You have successfully registered for <strong>" + data.eventTitle + "</strong>.</p>" +
               "<p>Your entry ticket is attached as a PDF to this email. Please keep it ready for check-in at the event.</p>" +
               "<br/>" +
               "<p>Best Regards,<br/>Event Organizing Team</p>";

    MailApp.sendEmail({
      to: data.email,
      subject: "Registration Success - " + (data.eventTitle || "Event"),
      htmlBody: body,
      attachments: [blob]
    });
    
    console.log("Ticket PDF sent successfully to " + data.email);
  } catch (e) {
    console.error("Failed to send email to " + data.email + ": " + e.toString());
  }
}
