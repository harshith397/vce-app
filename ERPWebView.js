import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getDashboardParserScript } from './parsers/dashboardParser.js';
import { getAttendanceParserScript } from './parsers/attendanceParser.js';
import { getDayWiseAttendanceParserScript } from './parsers/dayWiseAttendanceParser.js';
import { getMarksParserScript } from './parsers/marksParser.js';

const ERP_LOGIN_URL = 'https://erp.vce.ac.in/sinfo/Default.aspx?msg=loginrequired';
const ERP_DASHBOARD_URL = 'https://erp.vce.ac.in/sinfo/DashBoard.aspx';
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

const ERPWebView = forwardRef(function ERPWebView(
  {
    onDashboardData,
    onAttendanceData,
    onDayWiseData,
    onMarksData,
    onAuthRequired,
    onLogoutComplete,
    onError,
    style,
  },
  ref
) {
  const webViewRef = useRef(null);
  const parserModeRef = useRef(null); // null | 'summary' | 'daywise' | 'marks' | 'dashboard'
  const isLoggingOutRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentUrlRef = useRef(ERP_LOGIN_URL);

  // Trigger page-specific parser based on URL and current parser mode
  const checkAndRunParser = useCallback((url) => {
    if (!webViewRef.current || !url) return;

    const lowerUrl = url.toLowerCase();
    const mode = parserModeRef.current;

    // Check if on login page
    if (
      lowerUrl.indexOf('default.aspx') !== -1 ||
      lowerUrl.indexOf('loginrequired') !== -1
    ) {
      parserModeRef.current = null;
      if (isLoggingOutRef.current) {
        isLoggingOutRef.current = false;
        if (onLogoutComplete) {
          onLogoutComplete();
          return;
        }
      }
      if (onAuthRequired) onAuthRequired();
      return;
    }

    // Dashboard page detection
    if (lowerUrl.indexOf('dashboard.aspx') !== -1 || mode === 'dashboard') {
      const script = getDashboardParserScript();
      webViewRef.current.injectJavaScript(script);
      return;
    }

    // Attendance page detection (ShowSemWiseAttendanceForWeb)
    if (
      lowerUrl.indexOf('showsemwiseattendanceforweb') !== -1 ||
      lowerUrl.indexOf('attendance') !== -1
    ) {
      if (mode === 'daywise') {
        const script = getDayWiseAttendanceParserScript();
        webViewRef.current.injectJavaScript(script);
      } else if (mode === 'summary') {
        // Summary mode: run attendance summary parser only (not day-wise prematurely)
        const script = getAttendanceParserScript();
        webViewRef.current.injectJavaScript(script);
      }
      return;
    }

    // Marks page detection (ViewSemWiseMarks or StudentSemWiseMarks)
    if (
      lowerUrl.indexOf('viewsemwisemarks') !== -1 ||
      lowerUrl.indexOf('studentsemwisemarks') !== -1 ||
      lowerUrl.indexOf('marks') !== -1
    ) {
      const script = getMarksParserScript();
      webViewRef.current.injectJavaScript(script);
      return;
    }

    // Fallback: Check DOM signals
    const probeScript = `
      (function() {
        if (document.getElementById('divStudentInfo')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DOM_PROBE_DASHBOARD" }));
        } else if (document.getElementById('TblDispAttInfo') || document.getElementById('TblDispAttSummary')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DOM_PROBE_ATTENDANCE" }));
        } else if (document.getElementById('pnlContents') || document.querySelector('table.tableclass')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DOM_PROBE_MARKS" }));
        }
      })();
      true;
    `;
    webViewRef.current.injectJavaScript(probeScript);
  }, [onAuthRequired, onLogoutComplete]);

  // Imperative Methods exposed to Parent
  useImperativeHandle(ref, () => ({
    navigate: (url, parserMode = null) => {
      if (!url) return;
      parserModeRef.current = parserMode;
      currentUrlRef.current = url;
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
      }
    },

    openDayWiseAttendance: (url) => {
      if (!url) return;
      parserModeRef.current = 'daywise';
      currentUrlRef.current = url;
      if (webViewRef.current) {
        const script = `
          (function() {
            var target = ${JSON.stringify(url)};
            if (window.location.href === target) {
              ${getDayWiseAttendanceParserScript()}
            } else {
              window.location.href = target;
            }
          })();
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    },

    openMarks: (url) => {
      if (!url) return;
      parserModeRef.current = 'marks';
      currentUrlRef.current = url;
      if (webViewRef.current) {
        const script = `
          (function() {
            var target = ${JSON.stringify(url)};
            if (window.location.href === target) {
              ${getMarksParserScript()}
            } else {
              window.location.href = target;
            }
          })();
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    },

    refresh: () => {
      parserModeRef.current = 'dashboard';
      currentUrlRef.current = ERP_DASHBOARD_URL;
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(ERP_DASHBOARD_URL)}; true;`);
      }
    },

    reload: () => {
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    },

    goBack: () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
      }
    },

    logout: () => {
      parserModeRef.current = null;
      isLoggingOutRef.current = true;
      if (webViewRef.current) {
        const logoutScript = `
          (function() {
            var btn = document.getElementById('btnLogOut') || document.querySelector('input[name="btnLogOut"]');
            if (btn) {
              btn.click();
            } else {
              window.location.href = '${ERP_LOGIN_URL}';
            }
          })();
          true;
        `;
        webViewRef.current.injectJavaScript(logoutScript);
      }
    },
  }));

  // Handle messages received from the WebView
  const handleMessage = useCallback((event) => {
    try {
      const rawData = event.nativeEvent.data;
      if (!rawData) return;
      const data = JSON.parse(rawData);

      switch (data.type) {
        case 'DASHBOARD_DATA':
          if (onDashboardData) onDashboardData(data);
          break;

        case 'ATTENDANCE_DATA':
          if (onAttendanceData) onAttendanceData(data);
          break;

        case 'DAYWISE_ATTENDANCE_DATA':
          if (onDayWiseData) onDayWiseData(data);
          break;

        case 'MARKS_DATA':
          if (onMarksData) onMarksData(data);
          break;

        case 'DOM_PROBE_DASHBOARD':
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(getDashboardParserScript());
          }
          break;

        case 'DOM_PROBE_ATTENDANCE':
          if (webViewRef.current) {
            const mode = parserModeRef.current;
            if (mode === 'daywise') {
              webViewRef.current.injectJavaScript(getDayWiseAttendanceParserScript());
            } else if (mode === 'summary') {
              webViewRef.current.injectJavaScript(getAttendanceParserScript());
            }
          }
          break;

        case 'DOM_PROBE_MARKS':
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(getMarksParserScript());
          }
          break;

        case 'AUTH_CHECK':
          if (!data.isAuthenticated) {
            if (isLoggingOutRef.current && onLogoutComplete) {
              isLoggingOutRef.current = false;
              onLogoutComplete();
            } else if (onAuthRequired) {
              onAuthRequired();
            }
          }
          break;

        case 'DASHBOARD_PARSE_ERROR':
        case 'ATTENDANCE_PARSE_ERROR':
        case 'DAYWISE_ATTENDANCE_PARSE_ERROR':
        case 'MARKS_PARSE_ERROR':
          if (onError) onError(data);
          break;

        default:
          break;
      }
    } catch (e) {
      if (onError) onError({ type: 'MESSAGE_PARSE_ERROR', error: e.message });
    }
  }, [onDashboardData, onAttendanceData, onDayWiseData, onMarksData, onAuthRequired, onLogoutComplete, onError]);

  const handleNavigationStateChange = (navState) => {
    currentUrlRef.current = navState.url;
    if (!navState.loading) {
      setIsLoading(false);
      checkAndRunParser(navState.url);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    checkAndRunParser(currentUrlRef.current);
  };

  const handleLoadProgress = ({ nativeEvent }) => {
    if (nativeEvent.progress === 1) {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ uri: ERP_LOGIN_URL }}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        userAgent={MOBILE_USER_AGENT}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onLoadProgress={handleLoadProgress}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        originWhitelist={['*']}
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to connect to ERP</Text>
            <Text style={styles.errorSubtitle}>
              {errorDesc || 'Please check your connection and try again'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                if (webViewRef.current) webViewRef.current.reload();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Reload</Text>
            </TouchableOpacity>
          </View>
        )}
        onError={(syntheticEvent) => {
          setIsLoading(false);
          const { nativeEvent } = syntheticEvent;
          if (onError) {
            onError({ type: 'WEBVIEW_LOAD_ERROR', error: nativeEvent.description });
          }
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (onError && nativeEvent.statusCode >= 400) {
            onError({
              type: 'WEBVIEW_HTTP_ERROR',
              statusCode: nativeEvent.statusCode,
              error: `Server responded with error (HTTP ${nativeEvent.statusCode})`,
            });
          }
        }}
      />
      {isLoading && (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Connecting to ERP Portal...</Text>
        </View>
      )}
    </View>
  );
});

export default ERPWebView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  webViewContainer: {
    flex: 1,
    width: '100%',
  },
  webView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  centerLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1000,
    elevation: 1000,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
