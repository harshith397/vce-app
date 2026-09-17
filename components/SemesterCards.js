import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme.js';

export default function SemesterCards({
  semesters = [],
  currentSemester = null,
  onOpenAttendance,
  onOpenMarks,
}) {
  if (!semesters || semesters.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No semester records found.</Text>
      </View>
    );
  }

  // Helper to extract semester number from string or number
  const parseSemNum = (val) => {
    if (typeof val === 'number') return val;
    const match = String(val || '').match(/(\d+)/g);
    if (match && match.length > 0) {
      return parseInt(match[match.length - 1], 10) || 0;
    }
    return 0;
  };

  // Sort semesters in descending order: current / highest semester first, down to semester 1
  const sortedSemesters = [...semesters].sort((a, b) => {
    const semA = parseSemNum(a.semester);
    const semB = parseSemNum(b.semester);
    if (semB !== semA) return semB - semA;
    return String(b.academicYear || '').localeCompare(String(a.academicYear || ''));
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Academic Semesters</Text>

      {sortedSemesters.map((sem, index) => {
        const isCurrent =
          currentSemester &&
          currentSemester.semester === sem.semester &&
          currentSemester.academicYear === sem.academicYear;

        const hasAttendance = Boolean(sem.attendanceUrl);
        const hasMarks = Boolean(sem.marksUrl);

        return (
          <View
            key={`${sem.semester}-${sem.academicYear || index}`}
            style={[styles.card, isCurrent && styles.cardCurrent]}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.semesterTitle}>Semester {sem.semester}</Text>
                  
                </View>
                <Text style={styles.academicYear}>
                  Academic Year: {sem.academicYear || 'N/A'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  sem.status?.toLowerCase() === 'studying'
                    ? styles.statusStudying
                    : styles.statusNormal,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    sem.status?.toLowerCase() === 'studying'
                      ? styles.statusStudyingText
                      : styles.statusNormalText,
                  ]}
                >
                  {sem.status || 'Status N/A'}
                </Text>
              </View>
            </View>

            {/* Dates & Attendance Summary Row */}
            <View style={styles.metaRow}>
              {sem.classStartDate ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Start</Text>
                  <Text style={styles.metaValue}>{sem.classStartDate}</Text>
                </View>
              ) : null}

              {sem.classEndDate ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>End</Text>
                  <Text style={styles.metaValue}>{sem.classEndDate}</Text>
                </View>
              ) : null}

              {sem.attendancePercentage !== null && sem.attendancePercentage !== undefined ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Attendance</Text>
                  <Text style={styles.attendanceValue}>
                    {sem.attendancePercentage}%
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.attButton,
                  !hasAttendance && styles.buttonDisabled,
                ]}
                disabled={!hasAttendance}
                activeOpacity={0.7}
                onPress={() => onOpenAttendance && onOpenAttendance(sem)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.attButtonText,
                    !hasAttendance && styles.buttonTextDisabled,
                  ]}
                >
                  Attendance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.marksButton,
                  !hasMarks && styles.buttonDisabled,
                ]}
                disabled={!hasMarks}
                activeOpacity={0.7}
                onPress={() => onOpenMarks && onOpenMarks(sem)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.marksButtonText,
                    !hasMarks && styles.buttonTextDisabled,
                  ]}
                >
                  Marks
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.md,
  },
  emptyContainer: {
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.md,
  },
  emptyText: {
    ...typography.secondaryBody,
    color: colors.secondaryText,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardCurrent: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  currentBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  currentBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  academicYear: {
    ...typography.caption,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusStudying: {
    backgroundColor: colors.successBg,
  },
  statusNormal: {
    backgroundColor: colors.neutralButton,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusStudyingText: {
    color: colors.successText,
  },
  statusNormalText: {
    color: colors.secondaryText,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryText,
  },
  attendanceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attButton: {
    backgroundColor: colors.primary,
  },
  marksButton: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  attButtonText: {
    color: '#FFFFFF',
  },
  marksButtonText: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: colors.secondaryText,
  },
});
