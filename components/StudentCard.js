import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme.js';

function getInitials(fullName) {
  if (!fullName) return 'S';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function StudentCard({ studentInfo }) {
  if (!studentInfo) return null;

  const {
    name = '',
    hallTicketNo = '',
    branch = '',
    year = '',
    semester = '',
    section = '',
    admissionDate = '',
    dateOfBirth = '',
    fatherName = '',
    currentStatus = '',
  } = studentInfo;

  return (
    <View style={styles.card}>
      {/* Header: Avatar, Name, Hall Ticket, Branch, and Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name || 'Student Name'}
          </Text>
          <Text style={styles.hallTicket}>
            {hallTicketNo || 'Hall Ticket N/A'}
          </Text>
          {branch ? (
            <Text style={styles.branch} numberOfLines={1}>
              {branch}
            </Text>
          ) : null}
        </View>

        {currentStatus ? (
          <View
            style={[
              styles.statusBadge,
              currentStatus.toLowerCase() === 'studying'
                ? styles.statusStudying
                : styles.statusNormal,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                currentStatus.toLowerCase() === 'studying'
                  ? styles.statusStudyingText
                  : styles.statusNormalText,
              ]}
            >
              {currentStatus}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Academic Cohort Metrics Strip: Year, Semester, Section */}
      {(year || semester || section) ? (
        <View style={styles.metricsRow}>
          {year ? (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Year</Text>
              <Text style={styles.metricValue}>{year}</Text>
            </View>
          ) : null}

          {year && (semester || section) ? (
            <View style={styles.metricDivider} />
          ) : null}

          {semester ? (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Semester</Text>
              <Text style={styles.metricValue}>{semester}</Text>
            </View>
          ) : null}

          {semester && section ? (
            <View style={styles.metricDivider} />
          ) : null}

          {section ? (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Section</Text>
              <Text style={styles.metricValue}>{section}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Structured Details: Father's Name, Date of Birth, Admission Date */}
      {(admissionDate || dateOfBirth || fatherName) ? (
        <View style={styles.detailsContainer}>
          {fatherName ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Father's Name</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {fatherName}
              </Text>
            </View>
          ) : null}
          {dateOfBirth ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>{dateOfBirth}</Text>
            </View>
          ) : null}
          {admissionDate ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Admission Date</Text>
              <Text style={styles.detailValue}>{admissionDate}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.2,
  },
  hallTicket: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.secondaryText,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  branch: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  statusStudying: {
    backgroundColor: '#E8F8ED',
  },
  statusStudyingText: {
    color: '#1E7E34',
    fontSize: 11,
    fontWeight: '700',
  },
  statusNormal: {
    backgroundColor: colors.neutralButton,
  },
  statusNormalText: {
    color: colors.secondaryText,
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: radius.md,
    paddingVertical: 10,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  detailsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 9,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    width: 115,
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryText,
    fontWeight: '600',
  },
});
