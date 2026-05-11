/**
 * Webhook script for Google Sheet registration.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheetId = data.sheetId;
    if (!sheetId) {
      return ContentService.createTextOutput("Error: Missing sheetId");
    }
    
    var sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    // Add Timestamp
    var timestamp = new Date();
    
    // Append row
    // Columns: Timestamp, studentName, rollNo, email, phoneNo, course, year, collegeName, isPartOfSociety, societyDepartment, availability, eventId, eventTitle, ticketId, attended, createdAt, attnd
    sheet.appendRow([
      timestamp, // Timestamp
      data.studentName,
      data.rollNo,
      data.email,
      data.phoneNo,
      data.course,
      data.year,
      data.collegeName,
      data.isPartOfSociety,
      data.societyDepartment,
      data.availability,
      data.eventId,
      data.eventTitle,
      data.ticketId,
      data.attended, // or data.attended ? true : false
      data.createdAt,
      "" // attnd (initially blank or false/No)
    ]);
    
    return ContentService.createTextOutput("Success");
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString());
  }
}
