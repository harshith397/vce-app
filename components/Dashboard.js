import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme.js';
import StudentCard from './StudentCard';
import AttendanceCalculator from './AttendanceCalculator';
import SemesterCards from './SemesterCards';

export default function Dashboard({
  dashboardData,
  attendanceData,
  attendanceLoading,
  attendanceError,
  currentSemester,
  refreshing,
  onRefresh,
  onLogout,
  onOpenAttendance,
  onOpenMarks,
}) {
  const studentInfo = dashboardData?.studentInfo;
  const semesters = dashboardData?.semesters || [];

  return (
    <View style={styles.container}>
      {/* Top App Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBlock}>
          
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.refreshButtonText}>Refresh</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 1. Student Info Card */}
        <StudentCard studentInfo={studentInfo} />

        {/* 2. Attendance Overview & Calculator Carousel (Loaded at Top) */}
        <AttendanceCalculator
          attendanceData={attendanceData}
          loading={attendanceLoading || (!attendanceData && !attendanceError)}
          error={attendanceError}
        />

        {/* 3. Academic Semesters List (Loaded in Descending Order) */}
        <SemesterCards
          semesters={semesters}
          currentSemester={currentSemester}
          onOpenAttendance={onOpenAttendance}
          onOpenMarks={onOpenMarks}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitleBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 20,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.neutralButton,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutralButtonText,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.destructiveButton,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.destructiveButtonText,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
