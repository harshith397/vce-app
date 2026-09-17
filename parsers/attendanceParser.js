import { PARSER_UTILS_SNIPPET } from './parserUtils.js';

/**
 * Generates the injected script to parse the Attendance Summary page.
 */
export function getAttendanceParserScript() {
  return `
(function() {
  ${PARSER_UTILS_SNIPPET}

  function attemptAttendanceParse(retriesLeft) {
    try {
      var table = findTableById('TblDispAttSummary');
      var headingEl = document.getElementById('TdAttSummaryHeading');
      var summaryPeriod = headingEl ? cleanText(headingEl.innerText) : '';

      if (!table) {
        if (retriesLeft > 0) {
          setTimeout(function() { attemptAttendanceParse(retriesLeft - 1); }, 200);
          return;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "ATTENDANCE_DATA",
          available: false,
          reason: "Attendance summary table not available",
          summaryPeriod: summaryPeriod,
          regular: null,
          eca: null
        }));
        return;
      }

    var rows = table.querySelectorAll('tr');
    if (!rows || rows.length <= 1) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "ATTENDANCE_DATA",
        available: false,
        reason: "Attendance summary has no rows",
        summaryPeriod: summaryPeriod,
        regular: null,
        eca: null
      }));
      return;
    }

    // Determine header indices from the first row that contains headers
    var headerRow = null;
    var startRowIdx = 1;

    for (var r = 0; r < rows.length; r++) {
      var rText = cleanText(rows[r].innerText).toLowerCase();
      if (rText.indexOf('subject type') !== -1 || rText.indexOf('total classes') !== -1) {
        headerRow = rows[r];
        startRowIdx = r + 1;
        break;
      }
    }

    if (!headerRow) {
      headerRow = rows[0];
      startRowIdx = 1;
    }

    var headerCells = headerRow.querySelectorAll('th, td');
    var colMap = {
      subjectType: 1,
      totalClasses: 2,
      presentees: 3,
      extraClasses: 4,
      abscentees: 5,
      totalAttendance: 6
    };

    for (var h = 0; h < headerCells.length; h++) {
      var hText = cleanText(headerCells[h].innerText).toLowerCase();
      if (hText.indexOf('subject type') !== -1 || hText === 'type') colMap.subjectType = h;
      else if (hText.indexOf('total classes') !== -1) colMap.totalClasses = h;
      else if (hText.indexOf('present') !== -1) colMap.presentees = h;
      else if (hText.indexOf('extra') !== -1) colMap.extraClasses = h;
      else if (hText.indexOf('abscent') !== -1 || hText.indexOf('absent') !== -1) colMap.abscentees = h;
      else if (hText.indexOf('total attendance') !== -1) colMap.totalAttendance = h;
    }

    var regularData = null;
    var ecaData = null;

    for (var i = startRowIdx; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll('td');
      if (!cells || cells.length < 3) continue;

      var typeText = cleanText(cells[colMap.subjectType] ? cells[colMap.subjectType].innerText : cells[1].innerText);
      var totalClasses = parseInt(cleanText(cells[colMap.totalClasses] ? cells[colMap.totalClasses].innerText : '0'), 10) || 0;
      var presentees = parseInt(cleanText(cells[colMap.presentees] ? cells[colMap.presentees].innerText : '0'), 10) || 0;
      var extraClasses = parseInt(cleanText(cells[colMap.extraClasses] ? cells[colMap.extraClasses].innerText : '0'), 10) || 0;
      var abscentees = parseInt(cleanText(cells[colMap.abscentees] ? cells[colMap.abscentees].innerText : '0'), 10) || 0;
      var totalAttendance = parseFloat(cleanText(cells[colMap.totalAttendance] ? cells[colMap.totalAttendance].innerText : '0')) || (presentees + extraClasses);

      var record = {
        "Total Classes": totalClasses,
        "Presentees": presentees,
        "Extra Classes": extraClasses,
        "Abscentees": abscentees,
        "Total Attendance": totalAttendance
      };

      var lowerType = typeText.toLowerCase();
      if (lowerType.indexOf('regular') !== -1) {
        regularData = record;
      } else if (lowerType.indexOf('eca') !== -1) {
        ecaData = record;
      } else if (!regularData) {
        regularData = record;
      }
    }

    if (!regularData && !ecaData) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "ATTENDANCE_DATA",
        available: false,
        reason: "No attendance records found in summary table",
        summaryPeriod: summaryPeriod,
        regular: null,
        eca: null
      }));
      return;
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "ATTENDANCE_DATA",
      available: true,
      summaryPeriod: summaryPeriod,
      regular: regularData,
      eca: ecaData
    }));

    } catch (err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "ATTENDANCE_PARSE_ERROR",
        error: err.message,
        stack: err.stack
      }));
    }
  }

  attemptAttendanceParse(15);
})();
true;
`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getAttendanceParserScript };
}
