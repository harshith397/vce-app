import { PARSER_UTILS_SNIPPET } from './parserUtils.js';

/**
 * Generates the injected script to parse the Semester Marks page.
 * Extracts dynamic assessment groups, two-level headers, subject rows, totals, and SGPA.
 */
export function getMarksParserScript() {
  return `
(function() {
  ${PARSER_UTILS_SNIPPET}

  function attemptMarksParse(retriesLeft) {
    try {
      var href = (window.location.href || '').toLowerCase();
      // If the WebView is still on a non-marks page, keep waiting
      var isMarksPage = href.indexOf('marks') !== -1 ||
                        href.indexOf('viewsemwisemarks') !== -1 ||
                        href.indexOf('studentsemwisemarks') !== -1;

      if (!isMarksPage && retriesLeft > 0) {
        setTimeout(function() { attemptMarksParse(retriesLeft - 1); }, 250);
        return;
      }

      // Check for explicit server-side error messages (e.g. tblerrormsg / lblmsg)
      var errMsgEl = document.getElementById('lblmsg') || document.getElementById('tblerrormsg');
      var serverErrorMsg = errMsgEl ? cleanText(errMsgEl.innerText) : '';

      // Locate table.tableclass or data table containing "Marks Details" or "Subject Name"
      var tables = document.querySelectorAll('table.tableclass, table');
      var marksTable = null;

      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        var txt = t.innerText.toLowerCase();
        if ((txt.indexOf('marks details') !== -1 || txt.indexOf('subject name') !== -1) &&
            (txt.indexOf('grade') !== -1 || txt.indexOf('sessional') !== -1 || txt.indexOf('asst') !== -1)) {
          marksTable = t;
          if (t.classList && t.classList.contains('tableclass')) break;
        }
      }

      if (!marksTable) {
        // If server explicitly showed an error (e.g. "Something error while getting marks"), report it
        if (serverErrorMsg) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "MARKS_DATA",
            available: false,
            reason: serverErrorMsg,
            title: '',
            headerGroups: [],
            assessmentGroups: [],
            columns: [],
            rows: [],
            totalRow: null,
            percentageRow: null,
            sgpa: null
          }));
          return;
        }

        // If retries remain, wait and poll again
        if (retriesLeft > 0) {
          setTimeout(function() { attemptMarksParse(retriesLeft - 1); }, 250);
          return;
        }

        // Retries exhausted and no table found
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "MARKS_DATA",
          available: false,
          reason: "Marks have not been uploaded or published for this semester yet.",
          title: '',
          headerGroups: [],
          assessmentGroups: [],
          columns: [],
          rows: [],
          totalRow: null,
          percentageRow: null,
          sgpa: null
        }));
        return;
      }

      var allTrs = marksTable.querySelectorAll('tr');
      if (!allTrs || allTrs.length < 3) {
        if (retriesLeft > 0) {
          setTimeout(function() { attemptMarksParse(retriesLeft - 1); }, 250);
          return;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "MARKS_DATA",
          available: false,
          reason: "Marks table has no subject data",
          title: '',
          headerGroups: [],
          assessmentGroups: [],
          columns: [],
          rows: [],
          totalRow: null,
          percentageRow: null,
          sgpa: null
        }));
        return;
      }

    var title = '';
    var headerGroupRow = null;
    var subHeaderRow = null;
    var dataStartIndex = 0;

    for (var r = 0; r < allTrs.length; r++) {
      var tr = allTrs[r];
      var trText = cleanText(tr.innerText).toLowerCase();

      // Check single title cell row (e.g. "2 Year and 4 Semester Marks Details")
      if (trText.indexOf('marks details') !== -1 && tr.cells && tr.cells.length === 1) {
        title = cleanText(tr.innerText);
        continue;
      }

      if (trText.indexOf('subject name') !== -1 && !headerGroupRow) {
        headerGroupRow = tr;
        subHeaderRow = allTrs[r + 1];
        dataStartIndex = r + 2;
        break;
      }
    }

    if (!headerGroupRow) {
      headerGroupRow = allTrs[0];
      subHeaderRow = allTrs[1];
      dataStartIndex = 2;
    }

    // 1. Parse Level 1 Header Groups
    var headerGroups = [];
    var hgCells = headerGroupRow.querySelectorAll('th, td');
    for (var hg = 0; hg < hgCells.length; hg++) {
      var hgCell = hgCells[hg];
      var span = parseInt(hgCell.getAttribute('colspan') || '1', 10);
      var rspan = parseInt(hgCell.getAttribute('rowspan') || '1', 10);
      headerGroups.push({
        label: cleanText(hgCell.innerText),
        colspan: span,
        rowspan: rspan
      });
    }

    // 2. Parse Level 2 Sub-Headers
    var subHeaders = [];
    if (subHeaderRow) {
      var shCells = subHeaderRow.querySelectorAll('th, td');
      for (var sh = 0; sh < shCells.length; sh++) {
        subHeaders.push(cleanText(shCells[sh].innerText));
      }
    }

    // 3. Build Columns and Assessment Groups
    var columns = [];
    var assessmentGroups = [];
    var subIdx = 0;

    for (var g = 0; g < headerGroups.length; g++) {
      var grp = headerGroups[g];
      if (grp.rowspan > 1 || grp.colspan <= 1) {
        columns.push({
          id: columns.length,
          group: '',
          sub: grp.label,
          label: grp.label,
          isGroup: false
        });
      } else {
        var groupCols = [];
        for (var c = 0; c < grp.colspan; c++) {
          var subLabel = subHeaders[subIdx] || ('Col ' + (columns.length + 1));
          subIdx++;
          var colObj = {
            id: columns.length,
            group: grp.label,
            sub: subLabel,
            label: grp.label + ' ' + subLabel,
            isGroup: true
          };
          columns.push(colObj);
          groupCols.push(colObj);
        }
        assessmentGroups.push({
          name: grp.label,
          cols: groupCols
        });
      }
    }

    // 4. Parse Subject Rows, Total Row, Percentage Row, and SGPA
    var rows = [];
    var totalRow = null;
    var percentageRow = null;
    var sgpa = null;

    // Search for SGPA across body
    var bodyText = document.body.innerText;
    var sgpaMatch = bodyText.match(/SGPA\\s*[:=-]?\\s*([0-9.]+)/i);
    if (sgpaMatch && sgpaMatch[1]) {
      sgpa = parseFloat(sgpaMatch[1]);
    }

    for (var d = dataStartIndex; d < allTrs.length; d++) {
      var dRow = allTrs[d];
      var dCells = dRow.querySelectorAll('td, th');
      if (!dCells || dCells.length === 0) continue;

      var firstText = cleanText(dCells[0].innerText).toLowerCase();
      var secondText = dCells[1] ? cleanText(dCells[1].innerText).toLowerCase() : '';

      // Total Row
      if (firstText === 'total' || secondText === 'total') {
        var expTotal = expandCells(dRow);
        totalRow = expTotal.map(function(c) { return cleanText(c.innerText); });
        continue;
      }

      // Percentage Row
      if (firstText === 'percentage' || secondText === 'percentage') {
        var expPerc = expandCells(dRow);
        percentageRow = expPerc.map(function(c) { return cleanText(c.innerText); });
        var rFull = cleanText(dRow.innerText);
        var rSgpa = rFull.match(/SGPA\\s*[:=-]?\\s*([0-9.]+)/i);
        if (rSgpa && rSgpa[1]) {
          sgpa = parseFloat(rSgpa[1]);
        }
        continue;
      }

      // Subject Data Row
      var expCells = expandCells(dRow);
      if (expCells.length < 3) continue;

      var sNoStr = cleanText(expCells[0].innerText);
      var sNo = parseInt(sNoStr, 10);
      if (isNaN(sNo)) continue;

      var subName = cleanText(expCells[1].innerText);
      var cellValues = expCells.map(function(c) { return cleanText(c.innerText); });

      rows.push({
        s_no: sNo,
        name: subName,
        values: cellValues
      });
    }

    if (rows.length === 0) {
      if (retriesLeft > 0) {
        setTimeout(function() { attemptMarksParse(retriesLeft - 1); }, 250);
        return;
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "MARKS_DATA",
        available: false,
        reason: "No subject marks uploaded yet for this semester.",
        title: title,
        headerGroups: [],
        assessmentGroups: [],
        columns: [],
        rows: [],
        totalRow: null,
        percentageRow: null,
        sgpa: null
      }));
      return;
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "MARKS_DATA",
      available: true,
      title: title,
      headerGroups: headerGroups,
      assessmentGroups: assessmentGroups,
      columns: columns,
      rows: rows,
      totalRow: totalRow,
      percentageRow: percentageRow,
      sgpa: sgpa
    }));

  } catch (err) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "MARKS_PARSE_ERROR",
      error: "Failed to parse marks: " + err.message,
      stack: err.stack
    }));
  }
}

  // Start polling with up to 15 retries (approx 3.75 seconds total)
  attemptMarksParse(15);
})();
true;
`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getMarksParserScript };
}
