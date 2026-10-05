/**
 * ====================================================================
 * ROTARACT CLUB OF PUNE ROYAL - 11th INSTALLATION REGISTRATION SCRIPT
 * ====================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Replace all code with this updated code.
 * 4. Save (floppy disk).
 * 5. Deploy > Manage deployments > Edit > New version > Deploy.
 */

function setupHeaders(sheet) {
  var headers = [
    "Sr. No.",
    "Registration Time",
    "Protocol Priority",
    "Full Name",
    "Contact Number",
    "Category",
    "Club Name",
    "District Council?",
    "Council Designation",
    "Club BOD?",
    "Club BOD Designation",
    "Announced by Anchor"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
  sheet.setFrozenRows(1);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Auto setup headers if first row is empty
    if (sheet.getRange(1, 1).getValue() === "") {
      setupHeaders(sheet);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // Action: Update announced status
    if (data.action === "TOGGLE_ANNOUNCED") {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) == String(data.id) || String(rows[i][0]) == String(data.srNo)) {
          var current = rows[i][11] === "YES";
          var updated = !current ? "YES" : "NO";
          sheet.getRange(i + 1, 12).setValue(updated);
          return ContentService.createTextOutput(JSON.stringify({ success: true, announced: updated === "YES" }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Sr No not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Smart row finder: Scan Column A to find the first truly empty row
    var colA = sheet.getRange("A:A").getValues();
    var targetRow = 2; // Row 1 is headers, so attendees start on Row 2
    for (var i = 1; i < colA.length; i++) {
      if (colA[i][0] === "" || colA[i][0] === null || colA[i][0] === undefined) {
        targetRow = i + 1;
        break;
      }
      if (i === colA.length - 1) {
        targetRow = colA.length + 1;
      }
    }

    // Sr. No. is exactly (targetRow - 1): Row 2 = Sr No 1, Row 3 = Sr No 2, etc.
    var srNo = targetRow - 1;

    var now = new Date();
    var timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MM-yyyy HH:mm:ss");
    
    // Determine Protocol Priority
    var priority = "4. Guest";
    if (data.category === "rotaractor" && data.isCouncilMember) {
      priority = "1. Council Rotaractor";
    } else if (data.category === "rotarian") {
      priority = "2. Rotarian";
    } else if (data.category === "rotaractor") {
      priority = "3. General Rotaractor";
    }
    
    var newRow = [
      srNo,
      timeStr,
      priority,
      data.name || "",
      "'" + (data.phone || ""), // prepended apostrophe preserves leading 0s in numbers
      (data.category || "").toUpperCase(),
      data.clubName || "N/A",
      data.isCouncilMember ? "YES" : "NO",
      data.councilDesignation || "-",
      data.isBodMember ? "YES" : "NO",
      data.bodDesignation || "-",
      data.announced ? "YES" : "NO"
    ];
    
    // Write directly into targetRow (avoids skipping rows even if blank cells existed)
    sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      srNo: srNo,
      id: String(srNo),
      targetRow: targetRow,
      message: "Row added to Google Sheet successfully" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    var colA = sheet.getRange("A:A").getValues();
    var lastFilledRow = 1;
    for (var i = 1; i < colA.length; i++) {
      if (colA[i][0] !== "" && colA[i][0] !== null && colA[i][0] !== undefined) {
        lastFilledRow = i + 1;
      }
    }

    if (lastFilledRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, registrations: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var rows = sheet.getRange(1, 1, lastFilledRow, 12).getValues();
    var registrations = [];
    
    // Skip row 0 (headers)
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] === "" || r[0] === null || r[0] === undefined) continue;
      
      var srNoNum = Number(r[0]) || i;
      registrations.push({
        id: String(srNoNum),
        srNo: srNoNum,
        createdAt: r[1] ? String(r[1]) : new Date().toISOString(),
        name: String(r[3] || ""),
        phone: String(r[4] || "").replace("'", ""),
        category: String(r[5] || "").toLowerCase(),
        clubName: String(r[6] || "N/A"),
        isCouncilMember: r[7] === "YES",
        councilDesignation: r[8] !== "-" ? String(r[8]) : undefined,
        isBodMember: r[9] === "YES",
        bodDesignation: r[10] !== "-" ? String(r[10]) : undefined,
        announced: r[11] === "YES"
      });
    }
    
    // Return newest first
    registrations.reverse();
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      registrations: registrations 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
