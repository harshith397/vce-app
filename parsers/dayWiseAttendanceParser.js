import { PARSER_UTILS_SNIPPET } from './parserUtils.js';

/**
 * Generates the injected script to parse Day-Wise Attendance.
 */
export function getDayWiseAttendanceParserScript() {
  return `
(function() {
  ${PARSER_UTILS_SNIPPET}

  function isAbsentBgColor(colorStr) {
    if (!colorStr) return false;
    var s = colorStr.toLowerCase().trim();
    if (s === 'white' || s === '#ffffff' || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') {
      return false;
    }
    // Check note: "Blue, Green, Brown Background color indicates Abscent Class"
    if (s.indexOf('dodgerblue') !== -1 || s.indexOf('blue') !== -1 || s.indexOf('brown') !== -1) {
      return true;
    }
    // Check rgb/rgba
    var match = s.match(/rgba?\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
    if (match) {
      var r = parseInt(match[1], 10);
      var g = parseInt(match[2], 10);
      var b = parseInt(match[3], 10);
      // Pure or near white
      if (r > 240 && g > 240 && b > 240) return false;
      // Blue dominance (DodgerBlue is rgb(30, 144, 255))
      if (b > 180 && b > r + 30) return true;
      // Brown tint (R > G > B, e.g. rgb(165, 42, 42))
      if (r > 120 && g < 100 && b < 100) return true;
    }
    return false;
  }

  function getCellStatus(cell, text) {
    if (!text || text === '-' || text === '--' || text === 'N/A') {
      return 'no_class';
    }

    var bgcolor = (cell.getAttribute('bgcolor') || '').toLowerCase();
    var styleBg = (cell.style.backgroundColor || '').toLowerCase();
    var computedBg = '';
    try {
      computedBg = (window.getComputedStyle(cell).backgroundColor || '').toLowerCase();
    } catch (e) {}

    if (isAbsentBgColor(bgcolor) || isAbsentBgColor(styleBg) || isAbsentBgColor(computedBg)) {
      return 'absent';
    }

    // Default with valid subject text on white background
    return 'present';
  }

  function isSlotBeyond420(timeStr) {
    if (!timeStr) return false;
    var s = String(timeStr).trim().toLowerCase();
    var parts = s.split(/[-–—to]/);
    var start = parts[0] ? parts[0].trim() : s;
    var m = start.match(/(\\d{1,2})[:.](\\d{2})/);
    if (m) {
      var hour = parseInt(m[1], 10);
      var min = parseInt(m[2], 10);
      if (start.indexOf('pm') !== -1 && hour < 12) hour += 12;
      if (hour > 16 || (hour === 16 && min >= 20)) return true;
    }
    return false;
  }

  function attemptDayWiseParse(retriesLeft) {
    try {
      var href = (window.location.href || '').toLowerCase();
      // If the WebView is still on a non-attendance page, keep waiting
      var isAttPage = href.indexOf('attendance') !== -1 ||
                      href.indexOf('showsemwiseattendance') !== -1;

      if (!isAttPage && retriesLeft > 0) {
        setTimeout(function() { attemptDayWiseParse(retriesLeft - 1); }, 250);
        return;
      }

      // Check for explicit server-side error messages (e.g. tblerrormsg / lblmsg)
      var errMsgEl = document.getElementById('lblmsg') || document.getElementById('tblerrormsg');
      var serverErrorMsg = errMsgEl ? cleanText(errMsgEl.innerText) : '';

      var mainTable = findTableById('TblDispAttInfo');
      var headingEl = document.getElementById('TdAttSummaryHeading');
      var summaryPeriod = headingEl ? cleanText(headingEl.innerText) : '';

      if (!mainTable) {
        if (serverErrorMsg) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "DAYWISE_ATTENDANCE_DATA",
            available: false,
            reason: serverErrorMsg,
            summaryPeriod: summaryPeriod,
            periodHeaders: [],
            mainAttendance: [],
            additionalAttendance: [],
            subjectSummary: null,
            attendanceSummary: null
          }));
          return;
        }

        if (retriesLeft > 0) {
          setTimeout(function() { attemptDayWiseParse(retriesLeft - 1); }, 250);
          return;
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "DAYWISE_ATTENDANCE_DATA",
          available: false,
          reason: "Day-wise attendance records not found for this semester.",
          summaryPeriod: summaryPeriod,
          periodHeaders: [],
          mainAttendance: [],
          additionalAttendance: [],
          subjectSummary: null,
          attendanceSummary: null
        }));
        return;
      }

      var rows = mainTable.querySelectorAll('tr');
      if (!rows || rows.length <= 1) {
        if (retriesLeft > 0) {
          setTimeout(function() { attemptDayWiseParse(retriesLeft - 1); }, 250);
          return;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "DAYWISE_ATTENDANCE_DATA",
          available: false,
          reason: "No attendance rows available for this semester.",
          summaryPeriod: summaryPeriod,
          periodHeaders: [],
          mainAttendance: [],
          additionalAttendance: [],
          subjectSummary: null,
          attendanceSummary: null
        }));
        return;
      }

    // 1. Locate the exact header row containing "S.No" and "Date"
    var headerRow = null;
    var dataStartIdx = 1;

    for (var r = 0; r < rows.length; r++) {
      var rText = cleanText(rows[r].innerText).toLowerCase();
      if (rText.indexOf('s.no') !== -1 && rText.indexOf('date') !== -1) {
        headerRow = rows[r];
        dataStartIdx = r + 1;
        break;
      }
    }

    if (!headerRow) {
      headerRow = rows[0];
      dataStartIdx = 1;
    }

    var rawHeaderCells = headerRow.querySelectorAll('th, td');
    var dateColIdx = 2;
    var olColIdx = -1;
    var periodHeaders = [];

    for (var h = 0; h < rawHeaderCells.length; h++) {
      var hText = cleanText(rawHeaderCells[h].innerText);
      var lowerH = hText.toLowerCase();
      if (lowerH === 'date') {
        dateColIdx = h;
      } else if (lowerH === 'ol') {
        olColIdx = h;
      }
    }

    if (olColIdx === -1) {
      for (var h2 = 0; h2 < rawHeaderCells.length; h2++) {
        var lowerH2 = cleanText(rawHeaderCells[h2].innerText).toLowerCase();
        if (lowerH2 === 'pre' || lowerH2 === 'present') {
          olColIdx = h2 - 1;
          break;
        }
      }
    }

    if (olColIdx === -1) {
      olColIdx = rawHeaderCells.length - 4;
    }

    // Extract exact period headers strictly from the HTML table, excluding any slot beyond 4:20 PM
    var periodHeaders = [];
    var validPeriodColIndices = [];

    if (olColIdx > dateColIdx + 1) {
      for (var p = dateColIdx + 1; p < olColIdx; p++) {
        var rawSlot = cleanText(rawHeaderCells[p].innerText);
        if (!isSlotBeyond420(rawSlot)) {
          periodHeaders.push(rawSlot);
          validPeriodColIndices.push(p);
        }
      }
    }

    var mainAttendance = [];

    // 2. Parse data rows
    for (var i = dataStartIdx; i < rows.length; i++) {
      var row = rows[i];
      var expanded = expandCells(row);
      // Row must contain S.No, Branch, Date, periods, OL, Pre, Abs, Total
      if (expanded.length < 5) continue;

      var sno = cleanText(expanded[0].innerText);
      var branch = cleanText(expanded[1].innerText);
      var date = cleanText(expanded[2].innerText);

      var periods = [];

      for (var pi = 0; pi < validPeriodColIndices.length; pi++) {
        var cellIndex = validPeriodColIndices[pi];
        var timeLabel = periodHeaders[pi];
        if (cellIndex < expanded.length) {
          var pCell = expanded[cellIndex];
          var subject = cleanText(pCell.innerText);
          var status = getCellStatus(pCell, subject);
          periods.push({
            time: timeLabel,
            subject: subject === '-' ? '' : subject,
            status: status
          });
        }
      }

      // Trailing columns: OL, Pre, Abs, Total (directly at olColIdx, +1, +2, +3)
      var olText = expanded[olColIdx] ? cleanText(expanded[olColIdx].innerText) : '-';
      var preText = expanded[olColIdx + 1] ? cleanText(expanded[olColIdx + 1].innerText) : '0';
      var absText = expanded[olColIdx + 2] ? cleanText(expanded[olColIdx + 2].innerText) : '0';
      var totText = expanded[olColIdx + 3] ? cleanText(expanded[olColIdx + 3].innerText) : '0';

      mainAttendance.push({
        sno: parseInt(sno, 10) || (i - dataStartIdx + 1),
        branch: branch,
        date: date,
        periods: periods,
        ol: olText,
        present: parseInt(preText, 10) || 0,
        absent: parseInt(absText, 10) || 0,
        total: parseInt(totText, 10) || 0
      });
    }

    // 3. Parse Additional Attendance (#TblDispAdditionalAttInfo)
    var additionalAttendance = [];
    var addTable = findTableById('TblDispAdditionalAttInfo');
    if (addTable) {
      var addRows = addTable.querySelectorAll('tr');
      var addStartIdx = 1;
      var addHeaderRow = addRows[0];
      for (var ar = 0; ar < addRows.length; ar++) {
        var arText = cleanText(addRows[ar].innerText).toLowerCase();
        if (arText.indexOf('s.no') !== -1 && arText.indexOf('date') !== -1) {
          addHeaderRow = addRows[ar];
          addStartIdx = ar + 1;
          break;
        }
      }

      var addHeaderCells = addHeaderRow ? addHeaderRow.querySelectorAll('th, td') : [];
      var addDateColIdx = 2;
      var addDayWisePreIdx = -1;

      for (var ah = 0; ah < addHeaderCells.length; ah++) {
        var ahText = cleanText(addHeaderCells[ah].innerText).toLowerCase();
        if (ahText === 'date') addDateColIdx = ah;
        else if (ahText.indexOf('day wise pre') !== -1) addDayWisePreIdx = ah;
      }

      if (addDayWisePreIdx === -1) {
        addDayWisePreIdx = addHeaderCells.length - 1;
      }

      var addValidColIndices = [];
      var addPeriodsList = [];

      for (var apCol = addDateColIdx + 1; apCol < addDayWisePreIdx; apCol++) {
        var apSlot = cleanText(addHeaderCells[apCol].innerText);
        if (!isSlotBeyond420(apSlot)) {
          addPeriodsList.push(apSlot);
          addValidColIndices.push(apCol);
        }
      }

      for (var a = addStartIdx; a < addRows.length; a++) {
        var aExp = expandCells(addRows[a]);
        if (aExp.length >= 4) {
          var aSno = cleanText(aExp[0].innerText);
          var aBranch = cleanText(aExp[1].innerText);
          var aDate = cleanText(aExp[2].innerText);

          var aPeriods = [];
          for (var api = 0; api < addValidColIndices.length; api++) {
            var aCellIdx = addValidColIndices[api];
            if (aCellIdx < aExp.length) {
              var aCell = aExp[aCellIdx];
              var aSub = cleanText(aCell.innerText);
              aPeriods.push({
                time: addPeriodsList[api],
                subject: aSub === '-' ? '' : aSub,
                status: getCellStatus(aCell, aSub)
              });
            }
          }

          var dayWisePre = aExp[addDayWisePreIdx] ? cleanText(aExp[addDayWisePreIdx].innerText) : '';

          additionalAttendance.push({
            sno: parseInt(aSno, 10) || (a - addStartIdx + 1),
            branch: aBranch,
            date: aDate,
            periods: aPeriods,
            dayWisePre: dayWisePre
          });
        }
      }
    }

    // 4. Parse Subject Summary (#TblDispAttSubSummary)
    var subjectSummaryList = [];
    var subTable = findTableById('TblDispAttSubSummary');
    if (subTable) {
      var subRows = subTable.querySelectorAll('tr');
      if (subRows && subRows.length >= 2) {
        var subHeaderCells = subRows[0].querySelectorAll('th, td');
        var subjectsList = [];
        for (var sc = 1; sc < subHeaderCells.length; sc++) {
          subjectsList.push(cleanText(subHeaderCells[sc].innerText));
        }

        // Map row labels
        var metricRows = {};
        for (var mr = 1; mr < subRows.length; mr++) {
          var mCells = subRows[mr].querySelectorAll('td');
          if (mCells.length > 0) {
            var label = cleanText(mCells[0].innerText).toLowerCase();
            var values = [];
            for (var mc = 1; mc < mCells.length; mc++) {
              values.push(cleanText(mCells[mc].innerText));
            }
            metricRows[label] = values;
          }
        }

        var heldList = metricRows['held classes'] || [];
        var preList = metricRows['presentees'] || [];
        var absList = metricRows['abscentees'] || [];
        var extraList = metricRows['extra classes'] || [];

        for (var sIdx = 0; sIdx < subjectsList.length; sIdx++) {
          var subName = subjectsList[sIdx];
          var held = parseInt(heldList[sIdx] || '0', 10) || 0;
          var present = parseInt(preList[sIdx] || '0', 10) || 0;
          var absent = parseInt(absList[sIdx] || '0', 10) || 0;
          var extra = parseInt(extraList[sIdx] || '0', 10) || 0;
          var totalAttended = present + extra;
          var pct = held > 0 ? parseFloat(((totalAttended / held) * 100).toFixed(2)) : 0;

          subjectSummaryList.push({
            subject: subName,
            held: held,
            present: present,
            absent: absent,
            extra: extra,
            percentage: pct
          });
        }
      }
    }

    // 5. Parse Overall Attendance Summary (#TblDispAttSummary)
    var attendanceSummaryData = null;
    var sumTable = findTableById('TblDispAttSummary');
    if (sumTable) {
      var sumRows = sumTable.querySelectorAll('tr');
      var regRec = null;
      var ecaRec = null;

      for (var sr = 0; sr < sumRows.length; sr++) {
        var sCells = sumRows[sr].querySelectorAll('td');
        if (sCells.length >= 7) {
          var sType = cleanText(sCells[1].innerText).toLowerCase();
          var rec = {
            "Total Classes": parseInt(cleanText(sCells[2].innerText), 10) || 0,
            "Presentees": parseInt(cleanText(sCells[3].innerText), 10) || 0,
            "Extra Classes": parseInt(cleanText(sCells[4].innerText), 10) || 0,
            "Abscentees": parseInt(cleanText(sCells[5].innerText), 10) || 0,
            "Total Attendance": parseFloat(cleanText(sCells[6].innerText)) || 0
          };
          if (sType.indexOf('regular') !== -1) regRec = rec;
          else if (sType.indexOf('eca') !== -1) ecaRec = rec;
        }
      }

      if (regRec || ecaRec) {
        attendanceSummaryData = {
          regular: regRec,
          eca: ecaRec
        };
      }
    }

    // Send final DAYWISE_ATTENDANCE_DATA
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "DAYWISE_ATTENDANCE_DATA",
      available: true,
      summaryPeriod: summaryPeriod,
      periodHeaders: periodHeaders,
      mainAttendance: mainAttendance,
      additionalAttendance: additionalAttendance,
      subjectSummary: subjectSummaryList,
      attendanceSummary: attendanceSummaryData
    }));

  } catch (err) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "DAYWISE_ATTENDANCE_PARSE_ERROR",
      error: "Failed to parse day-wise attendance: " + err.message,
      stack: err.stack
    }));
  }
}

  // Start polling with up to 15 retries (approx 3.75 seconds total)
  attemptDayWiseParse(15);
})();
true;
`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getDayWiseAttendanceParserScript };
}
