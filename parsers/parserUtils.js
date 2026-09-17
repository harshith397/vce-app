/**
 * Common Injected Parser Utilities
 * These functions are injected into the WebView execution context.
 */

export const PARSER_UTILS_SNIPPET = `
function cleanText(str) {
  if (str == null) return '';
  return String(str)
    .replace(/\\u00a0/g, ' ')
    .replace(/\\s+/g, ' ')
    .replace(/^[:\\s]+|[:\\s]+$/g, '')
    .trim();
}

function findTableById(id) {
  var el = document.getElementById(id);
  if (!el) return null;
  // If this element contains an inner table (ASP.NET table inside td), return that real data table
  var innerTable = el.querySelector('table.tableclass') || el.querySelector('table');
  if (innerTable) return innerTable;
  if (el.tagName && el.tagName.toUpperCase() === 'TABLE') return el;
  return null;
}

function extractPopupUrl(element) {
  if (!element) return null;
  var onclick = element.getAttribute('onclick') || '';
  if (!onclick && element.parentElement) {
    onclick = element.parentElement.getAttribute('onclick') || '';
  }
  
  var match = onclick.match(/popUp\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)/i);
  var path = null;
  if (match && match[1]) {
    path = match[1];
  } else {
    var href = element.getAttribute('href') || '';
    if (href && href.indexOf('javascript:') !== 0) {
      path = href;
    }
  }

  if (!path) return null;

  // Decode HTML entities
  try {
    var txt = document.createElement('textarea');
    txt.innerHTML = path;
    path = txt.value;
  } catch (e) {}

  // Resolve to absolute URL
  try {
    return new URL(path, window.location.href).href;
  } catch (e) {
    var origin = window.location.origin;
    if (path.indexOf('http') === 0) return path;
    if (path.indexOf('/') === 0) return origin + path;
    var cur = window.location.pathname;
    var dir = cur.substring(0, cur.lastIndexOf('/') + 1);
    return origin + dir + path;
  }
}

function expandCells(row) {
  var expanded = [];
  if (!row || !row.cells) return expanded;
  for (var i = 0; i < row.cells.length; i++) {
    var cell = row.cells[i];
    var span = parseInt(cell.getAttribute('colspan') || '1', 10);
    if (isNaN(span) || span < 1) span = 1;
    for (var s = 0; s < span; s++) {
      expanded.push(cell);
    }
  }
  return expanded;
}
`;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PARSER_UTILS_SNIPPET };
}
