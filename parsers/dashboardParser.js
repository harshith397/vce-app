import { PARSER_UTILS_SNIPPET } from './parserUtils.js';

/**
 * Generates the injected script to parse the authenticated ERP Dashboard page.
 */
export function getDashboardParserScript() {
  return `
(function() {
  ${PARSER_UTILS_SNIPPET}

  function attemptDashboardParse(retriesLeft) {
    try {
      var studentInfoDiv = document.getElementById('divStudentInfo');
      if (!studentInfoDiv) {
        if (retriesLeft > 0) {
          setTimeout(function() { attemptDashboardParse(retriesLeft - 1); }, 200);
          return;
        }
        var href = (window.location.href || '').toLowerCase();
        if (href.indexOf('default.aspx') !== -1 || href.indexOf('loginrequired') !== -1) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "AUTH_CHECK",
            isAuthenticated: false,
            reason: "divStudentInfo not found after retries"
          }));
        }
        return;
      }

    // 1. Parse Student Info
    var studentInfo = {
      name: '',
      hallTicketNo: '',
      dateOfBirth: '',
      fatherName: '',
      admissionDate: '',
      branch: '',
      year: '',
      semester: '',
      section: '',
      currentStatus: ''
    };

    var rows = studentInfoDiv.querySelectorAll('tr');
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].querySelectorAll('td, th');
      if (cells.length >= 2) {
        var key = cleanText(cells[0].innerText).toLowerCase();
        var val = cleanText(cells[1].innerText);

        if (key.indexOf('hall ticket') !== -1 || key.indexOf('htno') !== -1) {
          studentInfo.hallTicketNo = val;
        } else if (key === 'name' || key.indexOf('student name') !== -1) {
          studentInfo.name = val;
        } else if (key.indexOf('birth') !== -1 || key.indexOf('dob') !== -1) {
          studentInfo.dateOfBirth = val;
        } else if (key.indexOf('father') !== -1) {
          studentInfo.fatherName = val;
        } else if (key.indexOf('admission') !== -1) {
          studentInfo.admissionDate = val;
        } else if (key.indexOf('branch') !== -1) {
          studentInfo.branch = val;
        } else if (key === 'year' || key.indexOf('study year') !== -1) {
          studentInfo.year = val;
        } else if (key === 'semester' || key === 'sem' || key === 'sem.') {
          studentInfo.semester = val;
        } else if (key.indexOf('section') !== -1 || key === 'sec') {
          studentInfo.section = val;
        } else if (key.indexOf('status') !== -1) {
          studentInfo.currentStatus = val;
        }
      }
    }

    // 2. Parse Semesters from #divAttSummary
    var semesters = [];
    var attSummaryDiv = document.getElementById('divAttSummary');
    var attTable = attSummaryDiv ? (attSummaryDiv.querySelector('table') || attSummaryDiv) : null;

    if (attTable) {
      var semRows = attTable.querySelectorAll('tr');
      for (var i = 0; i < semRows.length; i++) {
        var row = semRows[i];
        var rowCells = row.querySelectorAll('td');
        if (rowCells && rowCells.length >= 7) {
          var studyYear = cleanText(rowCells[0].innerText);
          var semStr = cleanText(rowCells[1].innerText);
          var academicYear = cleanText(rowCells[2].innerText);
          var status = cleanText(rowCells[3].innerText);
          var classStartDate = cleanText(rowCells[4].innerText);
          var classEndDate = cleanText(rowCells[5].innerText);

          var semNum = parseInt(semStr, 10);
          if (isNaN(semNum)) {
            // Header row ("Year", "Sem.", etc.)
            continue;
          }

          // Cell 6: Attendance Link
          var attCell = rowCells[6];
          var attAnchor = attCell.querySelector('a') || attCell;
          var attendanceUrl = extractPopupUrl(attAnchor);
          var attText = cleanText(attCell.innerText);
          var attendancePercentage = parseFloat(attText);
          if (isNaN(attendancePercentage)) attendancePercentage = null;

          // Cell 7: Marks Link (if present)
          var marksUrl = null;
          if (rowCells.length >= 8) {
            var marksCell = rowCells[7];
            var marksAnchor = marksCell.querySelector('a') || marksCell;
            marksUrl = extractPopupUrl(marksAnchor);
          }

          semesters.push({
            studyYear: studyYear,
            semester: semNum,
            academicYear: academicYear,
            status: status,
            classStartDate: classStartDate,
            classEndDate: classEndDate,
            attendanceUrl: attendanceUrl,
            marksUrl: marksUrl,
            attendancePercentage: attendancePercentage
          });
        }
      }
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "DASHBOARD_DATA",
      studentInfo: studentInfo,
      semesters: semesters
    }));

    } catch (err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "DASHBOARD_PARSE_ERROR",
        error: err.message,
        stack: err.stack
      }));
    }
  }

  attemptDashboardParse(15);
})();
true;
`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getDashboardParserScript };
}
