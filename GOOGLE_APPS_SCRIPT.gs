/* 
  GOOGLE APPS SCRIPT Bridge for INFINITIUM Society
  
  DEPLOY INSTRUCTIONS:
  1. Go to script.google.com
  2. Create a new project.
  3. Paste this code.
  4. Click "Deploy" > "New Deployment".
  5. Select type "Web App".
  6. Execute as: "Me" (Your account).
  7. Who has access: "Anyone".
  8. Copy the Web App URL and set it as VITE_APPS_SCRIPT_URL in your .env.example (and AI Studio Secrets).

  This script will automatically create headers if the sheet is empty
  and append student registration data based on the provided sheetId.
*/

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || "register";
    var sheetId = data.sheetId;
    
    if (!sheetId) {
      throw new Error("Missing sheetId");
    }

    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheets()[0];
    
    if (action === "register") {
      // Check if sheet is empty to add headers
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Student Name", "Roll No", "Email", "Ticket ID", "Status"]);
        sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      // Append the data
      sheet.appendRow([
        new Date(),
        data.studentName,
        data.rollNo,
        data.email,
        data.ticketId,
        "Registered"
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === "markAttendance") {
      var ticketId = data.ticketId;
      if (!ticketId) throw new Error("Missing ticketId");
      
      var rows = sheet.getDataRange().getValues();
      var ticketColumnIndex = 4; // 0-indexed, so 5th column
      var statusColumnIndex = 5; // 6th column
      
      var foundIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][ticketColumnIndex] === ticketId) {
          foundIndex = i;
          break;
        }
      }
      
      if (foundIndex === -1) {
        throw new Error("Ticket ID not found in this event's records");
      }
      
      var alreadyMarked = rows[foundIndex][statusColumnIndex] === "Attended";
      if (!alreadyMarked) {
        sheet.getRange(foundIndex + 1, statusColumnIndex + 1).setValue("Attended");
      }
      
      var studentData = {
        studentName: rows[foundIndex][1],
        rollNo: rows[foundIndex][2],
        email: rows[foundIndex][3]
      };
      
      return ContentService.createTextOutput(JSON.stringify({ 
        "status": "success", 
        "alreadyMarked": alreadyMarked,
        "student": studentData 
      })).setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("INFINITIUM API is active.");
}
