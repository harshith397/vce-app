import React, { useRef, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, StatusBar, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows, typography } from './theme.js';
import ERPWebView from './ERPWebView.js';
import Dashboard from './components/Dashboard.js';
import DayWiseAttendanceScreen from './components/DayWiseAttendanceScreen.js';
import MarksScreen from './components/MarksScreen.js';

export default function App() {
  const erpRef = useRef(null);

  // Application Authentication & Navigation State
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeScreen, setActiveScreen] = useState('dashboard'); // 'dashboard' | 'daywise' | 'marks'
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [dashboardData, setDashboardData] = useState(null);

  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);

  const [dayWiseAttendanceData, setDayWiseAttendanceData] = useState(null);
  const [dayWiseAttendanceLoading, setDayWiseAttendanceLoading] = useState(false);
  const [dayWiseAttendanceError, setDayWiseAttendanceError] = useState(null);

  const [marksData, setMarksData] = useState(null);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksError, setMarksError] = useState(null);

  // Identify Current / Studying Semester
  const currentSemester = useMemo(() => {
    if (!dashboardData?.semesters || dashboardData.semesters.length === 0) {
      return null;
    }
    const studying = dashboardData.semesters.find(
      (s) => s.status && s.status.toLowerCase().trim() === 'studying'
    );
    if (studying) return studying;

    return [...dashboardData.semesters].sort(
      (a, b) => (b.semester || 0) - (a.semester || 0)
    )[0];
  }, [dashboardData]);

  // Handler: Dashboard Data received from WebView
  const handleDashboardData = useCallback((data) => {
    setAuthenticated(true);
    setRefreshing(false);
    setIsLoggingOut(false);
    setDashboardData(data);

    // Automatically fetch current semester attendance
    const semesters = data?.semesters || [];
    const curr =
      semesters.find((s) => s.status && s.status.toLowerCase().trim() === 'studying') ||
      [...semesters].sort((a, b) => (b.semester || 0) - (a.semester || 0))[0];

    if (curr && curr.attendanceUrl && erpRef.current) {
      setAttendanceLoading(true);
      setAttendanceError(null);
      erpRef.current.navigate(curr.attendanceUrl, 'summary');
    }
  }, []);

  // Handler: Current Semester Attendance Summary
  const handleAttendanceData = useCallback((data) => {
    setAttendanceLoading(false);
    setAttendanceError(null);
    setAttendanceData(data);
  }, []);

  // Handler: Detailed Day-Wise Attendance
  const handleDayWiseData = useCallback((data) => {
    setDayWiseAttendanceLoading(false);
    setDayWiseAttendanceError(null);
    setDayWiseAttendanceData(data);
  }, []);

  // Handler: Semester Marks
  const handleMarksData = useCallback((data) => {
    setMarksLoading(false);
    setMarksError(null);
    setMarksData(data);
  }, []);

  // Handler: Auth required / Login page active
  const handleAuthRequired = useCallback(() => {
    if (!isLoggingOut) {
      setAuthenticated(false);
      setActiveScreen('dashboard');
    }
  }, [isLoggingOut]);

  // Handler: Server confirmed logout and arrived back at Login Page
  const handleLogoutComplete = useCallback(() => {
    setIsLoggingOut(false);
    setAuthenticated(false);
    setDashboardData(null);
    setAttendanceData(null);
    setDayWiseAttendanceData(null);
    setMarksData(null);
    setActiveScreen('dashboard');
  }, []);

  // Handler: Generic Errors from WebView Bridge
  const handleError = useCallback((err) => {
    const errorMsg = err.error || 'Network request failed';
    if (err.type === 'ATTENDANCE_PARSE_ERROR') {
      setAttendanceLoading(false);
      setAttendanceError(errorMsg);
    } else if (err.type === 'DAYWISE_ATTENDANCE_PARSE_ERROR') {
      setDayWiseAttendanceLoading(false);
      setDayWiseAttendanceError(errorMsg);
    } else if (err.type === 'MARKS_PARSE_ERROR') {
      setMarksLoading(false);
      setMarksError(errorMsg);
    } else if (err.type === 'WEBVIEW_LOAD_ERROR' || err.type === 'WEBVIEW_HTTP_ERROR') {
      setDayWiseAttendanceLoading(false);
      setDayWiseAttendanceError(errorMsg);
      setMarksLoading(false);
      setMarksError(errorMsg);
      setAttendanceLoading(false);
      setAttendanceError(errorMsg);
    }
  }, []);

  // Navigation: Open Day-Wise Attendance Screen
  const handleOpenAttendance = useCallback((sem) => {
    if (!sem?.attendanceUrl) return;
    setSelectedSemester(sem);
    setActiveScreen('daywise');
    setDayWiseAttendanceData(null);
    setDayWiseAttendanceLoading(true);
    setDayWiseAttendanceError(null);

    if (erpRef.current) {
      erpRef.current.openDayWiseAttendance(sem.attendanceUrl);
    }

    // Safety timeout: if portal server hangs for >15s, show retry option
    setTimeout(() => {
      setDayWiseAttendanceLoading((prev) => {
        if (prev) {
          setDayWiseAttendanceError('Server took too long to respond. Please check your connection and retry.');
          return false;
        }
        return false;
      });
    }, 15000);
  }, []);

  // Navigation: Open Marks Screen
  const handleOpenMarks = useCallback((sem) => {
    if (!sem?.marksUrl) return;
    setSelectedSemester(sem);
    setActiveScreen('marks');
    setMarksData(null);
    setMarksLoading(true);
    setMarksError(null);

    if (erpRef.current) {
      erpRef.current.openMarks(sem.marksUrl);
    }

    // Safety timeout: if portal server hangs for >15s, show retry option
    setTimeout(() => {
      setMarksLoading((prev) => {
        if (prev) {
          setMarksError('Server took too long to respond. Please check your connection and retry.');
          return false;
        }
        return false;
      });
    }, 15000);
  }, []);

  // Back Navigation
  const handleBackToDashboard = useCallback(() => {
    setActiveScreen('dashboard');
  }, []);

  // Refresh Application State
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setAttendanceLoading(true);
    if (erpRef.current) {
      erpRef.current.refresh();
    }
  }, []);

  // Logout Action with Server Acknowledgment Wait
  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    if (erpRef.current) {
      erpRef.current.logout();
    }
    // Safety fallback: if college server takes >8s to redirect, return to login
    setTimeout(() => {
      setIsLoggingOut((prev) => {
        if (prev) {
          handleLogoutComplete();
          return false;
        }
        return false;
      });
    }, 8000);
  }, [handleLogoutComplete]);

  const shouldHideWebView = authenticated || isLoggingOut;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

        <View style={styles.container}>
          {/* Persistent ERP WebView */}
          <View
            style={[
              styles.webViewWrapper,
              shouldHideWebView && styles.hiddenWebView,
            ]}
            pointerEvents={shouldHideWebView ? 'none' : 'auto'}
          >
            {!shouldHideWebView && (
              <View style={styles.loginBanner}>
                <Text style={styles.loginBannerTitle}>
                  Vasavi College of Engineering
                </Text>
                <Text style={styles.loginBannerSubtitle}>
                  Attendance Portal
                </Text>
              </View>
            )}

            <ERPWebView
              ref={erpRef}
              style={styles.erpWebView}
              onDashboardData={handleDashboardData}
              onAttendanceData={handleAttendanceData}
              onDayWiseData={handleDayWiseData}
              onMarksData={handleMarksData}
              onAuthRequired={handleAuthRequired}
              onLogoutComplete={handleLogoutComplete}
              onError={handleError}
            />
          </View>

          {/* Native UI Layer - Shown when authenticated */}
          {authenticated && (
            <View style={styles.nativeLayer}>
              {activeScreen === 'dashboard' && (
                <Dashboard
                  dashboardData={dashboardData}
                  attendanceData={attendanceData}
                  attendanceLoading={attendanceLoading}
                  attendanceError={attendanceError}
                  currentSemester={currentSemester}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onLogout={handleLogout}
                  onOpenAttendance={handleOpenAttendance}
                  onOpenMarks={handleOpenMarks}
                />
              )}

              {activeScreen === 'daywise' && (
                <DayWiseAttendanceScreen
                  semester={selectedSemester}
                  data={dayWiseAttendanceData}
                  loading={dayWiseAttendanceLoading}
                  error={dayWiseAttendanceError}
                  onBack={handleBackToDashboard}
                  onRetry={() => {
                    if (selectedSemester && erpRef.current) {
                      setDayWiseAttendanceLoading(true);
                      erpRef.current.openDayWiseAttendance(selectedSemester.attendanceUrl);
                    }
                  }}
                />
              )}

              {activeScreen === 'marks' && (
                <MarksScreen
                  semester={selectedSemester}
                  data={marksData}
                  loading={marksLoading}
                  error={marksError}
                  onBack={handleBackToDashboard}
                  onRetry={() => {
                    if (selectedSemester && erpRef.current) {
                      setMarksLoading(true);
                      erpRef.current.openMarks(selectedSemester.marksUrl);
                    }
                  }}
                />
              )}
            </View>
          )}

          {/* iOS-Style Logging Out Modal Overlay */}
          <Modal
            visible={isLoggingOut}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={() => {}}
          >
            <View style={styles.logoutModalOverlay}>
              <View style={styles.logoutModalCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.logoutModalTitle}>Signing Out</Text>
                <Text style={styles.logoutModalSubtitle}>
                  Logging out from college ERP server...
                </Text>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  webViewWrapper: {
    flex: 1,
    width: '100%',
  },
  erpWebView: {
    flex: 1,
    width: '100%',
  },
  hiddenWebView: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    zIndex: -999,
  },
  loginBanner: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  loginBannerTitle: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  loginBannerSubtitle: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  nativeLayer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  logoutModalOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoutModalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: 260,
    ...shadows.card,
  },
  logoutModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 14,
  },
  logoutModalSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 6,
    textAlign: 'center',
  },
});
