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
    var sheetId = data.sheetId; // Target Sheet ID passed from frontend
    var eventTitle = data.eventTitle || "Unknown Event";
    
    if (!sheetId) {
      throw new Error("Missing sheetId");
    }

    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheets()[0]; // Get the first sheet
    
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
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("INFINITIUM API is active.");
}
