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
    
    // Extract ID if full Google Spreadsheet URL is provided
    sheetId = sheetId.trim();
    if (sheetId.indexOf("docs.google.com/spreadsheets") !== -1 || sheetId.indexOf("http") !== -1) {
      var match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        sheetId = match[1];
      }
    }
    
    var spreadsheet = SpreadsheetApp.openById(sheetId);
    var sheet = spreadsheet.getSheets()[0]; // Get first sheet/tab explicitly (foolproof)
    
    // Ensure the sheet has at least 12 columns to prevent range exception errors when getting values
    var maxCols = sheet.getMaxColumns();
    if (maxCols < 12) {
      sheet.insertColumnsAfter(maxCols, 12 - maxCols);
    }
    
    if (data.type === 'attendance') {
      // Find row by ticketId and mark attendance
      var ticketId = data.ticketId;
      var range = sheet.getDataRange();
      var values = range.getValues();
      var ticketIdIndex = 10; // Column K (11th column, index 10)
      var attndIndex = 11;   // Column L (12th column, index 11)

      for (var i = 1; i < values.length; i++) {
        if (values[i][ticketIdIndex] === ticketId) {
          var alreadyMarked = (values[i][attndIndex] === "Yes");
          if (!alreadyMarked) {
            sheet.getRange(i + 1, attndIndex + 1).setValue("Yes");
          }
          var student = {
            studentName: values[i][0] || "",
            rollNo: values[i][1] || "",
            email: values[i][2] || "",
            course: values[i][3] || "",
            phoneNo: values[i][4] || "",
            year: values[i][5] || "",
            collegeName: values[i][6] || "",
            ticketId: ticketId
          };
          var response = {
            status: "success",
            alreadyMarked: alreadyMarked,
            student: student
          };
          return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
        }
      }
      var errResponse = { status: "error", message: "Ticket ID not found in sheet" };
      return ContentService.createTextOutput(JSON.stringify(errResponse)).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Registration flow
      var lastRow = sheet.getLastRow();
      
      // Define precisely the 12 required headers
      var headers = [
        "Name", "College Roll No.", "Email ID", "Course", "Phone No", "Year", "College Name", 
        "Part of Society", "Department", "availability", "Ticket-ID", "Attendance"
      ];
      
      // Better header detection: check if first row is actually headers (trimmed and lowercase check)
      var firstRowValues = lastRow > 0 ? sheet.getRange(1, 1, 1, 12).getValues()[0] : [];
      var hasHeaders = firstRowValues[0] && (firstRowValues[0].toString().trim().toLowerCase() === "name");

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
      
      // 2. Prevent duplicate registrations for an event (matching College Roll No. only)
      if (lastRow > 1) {
        var sheetValues = sheet.getRange(1, 1, lastRow, 12).getValues();
        var normalizedRoll = rollNo.toString().trim().toLowerCase();
        
        for (var i = 1; i < sheetValues.length; i++) {
          var rowRoll = (sheetValues[i][1] || "").toString().trim().toLowerCase();
          
          if (normalizedRoll && rowRoll === normalizedRoll) {
            console.warn("Blocked duplicate registration for College Roll No: " + normalizedRoll);
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
    var blob;
    var fileName = "Ticket_" + (data.ticketId || "Entry") + ".pdf";
    var qrCodeUrl = "https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=" + encodeURIComponent(data.ticketId || "");
    
    if (data.pdfBase64) {
      // Decode high-fidelity client-generated PDF
      var base64Data = data.pdfBase64;
      // If client sent the full data URI, strip prefix
      if (base64Data.indexOf("base64,") !== -1) {
        base64Data = base64Data.split("base64,")[1];
      }
      var decodedBytes = Utilities.base64Decode(base64Data);
      blob = Utilities.newBlob(decodedBytes, "application/pdf", fileName);
      console.log("Using client-provided high-fidelity PDF.");
    } else {
      // Fallback ticket layout with INFINITIUM / ARSD College branding
      
      // Create HTML for PDF (Professional Ticket Design)
      var pdfHtml = '<!DOCTYPE html><html><head><style>' +
                    'body { font-family: "Helvetica", "Arial", sans-serif; color: #1e293b; margin: 0; padding: 0; }' +
                    '.ticket { width: 600px; margin: 20px auto; border: 2px solid #14b8a6; border-radius: 10px; overflow: hidden; }' +
                    '.header { background-color: #0f0c29; color: white; padding: 25px 20px; text-align: center; border-bottom: 5px solid #14b8a6; }' +
                    '.header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; font-weight: bold; }' +
                    '.content { padding: 30px; display: flex; background: white; }' +
                    '.info { flex: 1; }' +
                    '.info p { margin: 10px 0; font-size: 14px; }' +
                    '.info b { color: #0f0c29; }' +
                    '.qr-side { text-align: center; padding-left: 20px; border-left: 1px dashed #ccc; }' +
                    '.footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }' +
                    '</style></head><body>' +
                    '<div class="ticket">' +
                    '  <div class="header">' +
                    '    <h1>INFINITIUM</h1>' +
                    '    <div style="font-size: 12px; margin-top: 5px; opacity: 0.9; letter-spacing: 1px;">ATMA RAM SANATAN DHARMA COLLEGE | UNIVERSITY OF DELHI</div>' +
                    '  </div>' +
                    '  <div class="content" style="display: table; width: 100%;">' +
                    '    <div style="display: table-cell; vertical-align: top; width: 60%; padding: 20px;">' +
                    '      <h2 style="color: #0f0c29; margin-top: 0; font-size: 18px; text-transform: uppercase;">' + (data.eventTitle || "Event Registration") + '</h2>' +
                    '      <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Official Entry Pass</p>' +
                    '      <p><b>Ticket ID:</b> ' + data.ticketId + '</p>' +
                    '      <p><b>Attendee:</b> ' + data.studentName + '</p>' +
                    '      <p><b>Roll No:</b> ' + data.rollNo + '</p>' +
                    '      <p><b>Course:</b> ' + (data.course === "Others" ? data.otherCourse : data.course) + ' (' + data.year + ')</p>' +
                    '      <p><b>College:</b> ' + data.collegeName + '</p>' +
                    '    </div>' +
                    '    <div style="display: table-cell; vertical-align: middle; text-align: center; width: 40%; border-left: 1px dashed #e2e8f0; padding: 20px;">' +
                    '      <img src="' + qrCodeUrl + '" width="150" height="150" style="display: block; margin: 0 auto;" />' +
                    '      <p style="font-size: 11px; color: #64748b; margin-top: 10px; font-weight: bold; letter-spacing: 1px;">SCAN FOR ENTRY</p>' +
                    '    </div>' +
                    '  </div>' +
                    '  <div class="footer">' +
                    '    * Please present this ticket (printed or digital) at the registration desk. <br/>' +
                    '    © Infinitium Society, Atma Ram Sanatan Dharma College' +
                    '  </div>' +
                    '</div></body></html>';
  
        blob = HtmlService.createHtmlOutput(pdfHtml).getAs('application/pdf');
        blob.setName(fileName);
      }
  
    // Professional Email Body (Infinitium Brand)
      var body = '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">' +
                 '  <div style="background-color: #0f0c29; border-top: 4px solid #14b8a6; padding: 25px; text-align: center;">' +
                 '    <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 2px;">INFINITIUM</h1>' +
                 '    <p style="color: #14b8a6; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">Atma Ram Sanatan Dharma College</p>' +
                 '  </div>' +
                 '  <div style="padding: 30px; line-height: 1.6; color: #334155; bg: #ffffff;">' +
                 '    <h2 style="color: #0f0c29; margin-top: 0; font-size: 18px;">Registration Confirmed!</h2>' +
                 '    <p>Dear <strong>' + data.studentName + '</strong>,</p>' +
                 '    <p>Thank you for registering. Your booking has been successfully recorded for the following event:</p>' +
                 '    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">' +
                 '      <p style="margin: 0; font-size: 15px;"><strong>Event:</strong> ' + data.eventTitle + '</p>' +
                 '      <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b;"><strong>Ticket ID:</strong> ' + data.ticketId + '</p>' +
                 '    </div>' +
                 '    <p><strong>Your official entry pass is attached to this email as a PDF ticket.</strong> Please have this PDF file or its printed version handy at the venue registration desk for smooth check-in.</p>' +
                 '    <p>We look forward to seeing you there!</p>' +
                 '    <p style="margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px;">' +
                 '      Warm regards,<br/>' +
                 '      <strong>Infinitium Organizing Committee</strong><br/>' +
                 '      Atma Ram Sanatan Dharma College, University of Delhi' +
                 '    </p>' +
                 '  </div>' +
                 '  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">' +
                 '    This is an automatically generated system email. Please do not reply directly to this message.' +
                 '  </div>' +
                 '</div>';
  
      MailApp.sendEmail({
        to: data.email,
        subject: "Registration Confirmed: " + (data.eventTitle || "Event"),
        htmlBody: body,
        attachments: [blob]
      });
      
      console.log("Ticket PDF sent successfully to " + data.email);
    } catch (e) {
      console.error("Failed to send email to " + data.email + ": " + e.toString());
    }
  }
