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
      var ticketIdIndex = 10; // Column K (11th column, index 10)
      var attndIndex = 11;   // Column L (12th column, index 11)

      for (var i = 1; i < values.length; i++) {
        if (values[i][ticketIdIndex] === ticketId) {
          sheet.getRange(i + 1, attndIndex + 1).setValue("Yes");
          return ContentService.createTextOutput("Attendance Marked");
        }
      }
      return ContentService.createTextOutput("Error: Ticket ID not found in sheet");
    } else {
      // Registration flow
      var lastRow = sheet.getLastRow();
      
      // Define precisely the 12 required headers
      var headers = [
        "Name", "College Roll No.", "Email ID", "Course", "Phone No", "Year", "College Name", 
        "Part of Society", "Department", "availability", "Ticket-ID", "Attendance"
      ];
      
      // Better header detection: check if first row is actually headers
      var firstRowValues = lastRow > 0 ? sheet.getRange(1, 1, 1, 12).getValues()[0] : [];
      var hasHeaders = firstRowValues[0] === "Name" || firstRowValues[0] === "name";

      if (!hasHeaders) {
        if (lastRow === 0) {
          sheet.appendRow(headers);
        } else {
          sheet.insertRowBefore(1);
          sheet.getRange(1, 1, 1, 12).setValues([headers]);
        }
        sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#f3f3f3");
        // Re-evaluate lastRow after insert
        lastRow = sheet.getLastRow();
      }

      // 1. Map fields with custom logic
      var studentName = data.studentName || "";
      var rollNo = data.rollNo || "";
      var email = data.email || "";
      var course = (data.course === "Others" ? data.otherCourse : (data.course || ""));
      var phoneNo = data.phoneNo || data.phone || "";
      var year = data.year || "";
      
      // Default College Name if empty or not provided
      var collegeName = (data.collegeName || data.college || "").trim();
      if (!collegeName) {
        collegeName = "Atma Ram Sanatan Dharma College, University of Delhi";
      }
      
      var isPartOfSociety = data.isPartOfSociety || "No";
      
      // Leave department empty if Part of Society is No
      var societyDepartment = (data.societyDepartment || "");
      if (isPartOfSociety.toString().trim().toLowerCase() === "no") {
        societyDepartment = "";
      }
      
      var availability = data.availability || "";
      var ticketId = data.ticketId || "";
      var attendance = ""; // attendance field is always empty initially
      
      // 2. Prevent duplicate registrations for an event (matching Email ID or College Roll No.)
      if (lastRow > 1) {
        var sheetValues = sheet.getRange(1, 1, lastRow, 12).getValues();
        var normalizedEmail = email.toString().trim().toLowerCase();
        var normalizedRoll = rollNo.toString().trim().toLowerCase();
        
        for (var i = 1; i < sheetValues.length; i++) {
          var rowRoll = (sheetValues[i][1] || "").toString().trim().toLowerCase();
          var rowEmail = (sheetValues[i][2] || "").toString().trim().toLowerCase();
          
          if ((normalizedRoll && rowRoll === normalizedRoll) || (normalizedEmail && rowEmail === normalizedEmail)) {
            console.warn("Blocked duplicate registration for: " + normalizedEmail + " / " + normalizedRoll);
            return ContentService.createTextOutput("Error: Duplicate Registration");
          }
        }
      }

      console.log("Appending registration data for: " + studentName);
      
      var rowData = [
        studentName,        // A: Name
        rollNo,             // B: College Roll No.
        email,              // C: Email ID
        course,             // D: Course
        phoneNo,            // E: Phone No
        year,               // F: Year
        collegeName,        // G: College Name
        isPartOfSociety,    // H: Part of Society
        societyDepartment,  // I: Department
        availability,       // J: availability
        ticketId,           // K: Ticket-ID
        attendance          // L: Attendance
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
    
    // Create HTML for PDF (Professional Ticket Design)
    var pdfHtml = '<!DOCTYPE html><html><head><style>' +
                  'body { font-family: "Helvetica", "Arial", sans-serif; color: #333; margin: 0; padding: 0; }' +
                  '.ticket { width: 600px; margin: 20px auto; border: 2px solid #1e3a8a; border-radius: 10px; overflow: hidden; }' +
                  '.header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }' +
                  '.header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }' +
                  '.content { padding: 30px; display: flex; }' +
                  '.info { flex: 1; }' +
                  '.info p { margin: 10px 0; font-size: 14px; }' +
                  '.info b { color: #1e3a8a; }' +
                  '.qr-side { text-align: center; padding-left: 20px; border-left: 1px dashed #ccc; }' +
                  '.footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }' +
                  '</style></head><body>' +
                  '<div class="ticket">' +
                  '  <div class="header">' +
                  '    <h1>ENTRY TICKET</h1>' +
                  '    <div style="font-size: 14px; margin-top: 5px; opacity: 0.9;">ADGITM EVENT PORTAL</div>' +
                  '  </div>' +
                  '  <div class="content" style="display: table; width: 100%;">' +
                  '    <div style="display: table-cell; vertical-align: top; width: 60%; padding: 20px;">' +
                  '      <h2 style="color: #1e3a8a; margin-top: 0;">' + (data.eventTitle || "Event Registration") + '</h2>' +
                  '      <p><b>Ticket ID:</b> ' + data.ticketId + '</p>' +
                  '      <p><b>Attendee:</b> ' + data.studentName + '</p>' +
                  '      <p><b>Roll No:</b> ' + data.rollNo + '</p>' +
                  '      <p><b>Course:</b> ' + (data.course === "Others" ? data.otherCourse : data.course) + ' (' + data.year + ')</p>' +
                  '      <p><b>College:</b> ' + data.collegeName + '</p>' +
                  '    </div>' +
                  '    <div style="display: table-cell; vertical-align: middle; text-align: center; width: 40%; border-left: 1px dashed #ccc; padding: 20px;">' +
                  '      <img src="' + qrCodeUrl + '" width="150" height="150" />' +
                  '      <p style="font-size: 11px; color: #666; margin-top: 10px;">SCAN FOR ENTRY</p>' +
                  '    </div>' +
                  '  </div>' +
                  '  <div class="footer">' +
                  '    IMPORTANT: Please present this ticket (printed or digital) at the registration desk. <br/>' +
                  '    © 2024 ADGITM Society Team. All rights reserved.' +
                  '  </div>' +
                  '</div></body></html>';

    var blob = HtmlService.createHtmlOutput(pdfHtml).getAs('application/pdf');
    blob.setName("Ticket_" + data.ticketId + ".pdf");

    // Professional Email Body
    var body = '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">' +
               '  <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">' +
               '    <h1 style="color: white; margin: 0; font-size: 20px;">Registration Confirmed</h1>' +
               '  </div>' +
               '  <div style="padding: 30px; line-height: 1.6; color: #334155;">' +
               '    <p>Dear <strong>' + data.studentName + '</strong>,</p>' +
               '    <p>We are excited to confirm your registration for <strong>' + data.eventTitle + '</strong>. Your spot has been successfully reserved.</p>' +
               '    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">' +
               '      <p style="margin: 0;"><strong>Event:</strong> ' + data.eventTitle + '</p>' +
               '      <p style="margin: 5px 0 0 0;"><strong>Ticket ID:</strong> ' + data.ticketId + '</p>' +
               '    </div>' +
               '    <p><strong>Your entry ticket is attached to this email as a PDF.</strong> Please ensure you have it available (on your phone or printed) to facilitate a smooth check-in process at the venue.</p>' +
               '    <p>If you have any questions or require further assistance, please do not hesitate to contact the organizing committee.</p>' +
               '    <p style="margin-top: 30px;">Best regards,<br/><strong>Event Organizing Team</strong><br/>ADGITM</p>' +
               '  </div>' +
               '  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">' +
               '    This is an automated message. Please do not reply directly to this email.' +
               '  </div>' +
               '</div>';

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
