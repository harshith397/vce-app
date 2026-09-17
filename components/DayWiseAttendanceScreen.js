import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, typography } from '../theme.js';

export default function DayWiseAttendanceScreen({
  semester,
  data,
  loading = false,
  error = null,
  onBack,
  onRetry,
}) {
  const periodHeaders = data?.periodHeaders || [];
  const mainAttendance = data?.mainAttendance || [];
  const additionalAttendance = data?.additionalAttendance || [];
  const subjectSummary = data?.subjectSummary || [];
  const attendanceSummary = data?.attendanceSummary;
  const hasMultipleSummaries = Boolean(attendanceSummary?.regular && attendanceSummary?.eca);

  // Build available tabs dynamically in strict order: Day-Wise -> Subject-Wise -> Additional -> Summary
  // Non-present tables/sections are excluded from the switcher completely.
  const availableTabs = useMemo(() => {
    const list = [];
    if (mainAttendance && mainAttendance.length > 0) {
      list.push({
        key: 'daywise',
        label: 'Day-Wise Attendance',
      });
    }
    if (subjectSummary && subjectSummary.length > 0) {
      list.push({
        key: 'subjects',
        label: 'Subject-Wise Attendance',
      });
    }
    if (additionalAttendance && additionalAttendance.length > 0) {
      list.push({
        key: 'additional',
        label: 'Additional Attendance',
      });
    }
    if (attendanceSummary && (attendanceSummary.regular || attendanceSummary.eca)) {
      list.push({
        key: 'summary',
        label: 'Attendance Summary',
      });
    }
    return list;
  }, [mainAttendance, subjectSummary, additionalAttendance, attendanceSummary]);

  const [selectedTab, setSelectedTab] = useState(null);

  // Fallback to the first available tab if selectedTab is not valid
  const activeTabKey = useMemo(() => {
    if (selectedTab && availableTabs.some((t) => t.key === selectedTab)) {
      return selectedTab;
    }
    return availableTabs[0]?.key || null;
  }, [selectedTab, availableTabs]);

  // Compute adaptive max height with comfortable bottom padding to prevent curved screen edges from blocking elements
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const bottomPadding = Math.max(96, (insets?.bottom || 0) + 64);
  const topOffset = 48 + 16 + (data?.summaryPeriod ? 40 : 0) + (availableTabs.length > 1 ? 42 : 0);
  const maxCardHeight = Math.max(220, windowHeight - topOffset - bottomPadding);

  // Scroll references & initial position tracking
  const dayWiseScrollRef = useRef(null);
  const additionalScrollRef = useRef(null);
  const hasScrolledDayWise = useRef(false);
  const hasScrolledAdditional = useRef(false);

  // Reset initial scroll flags on tab switch, semester, or data load
  useEffect(() => {
    hasScrolledDayWise.current = false;
    hasScrolledAdditional.current = false;
  }, [activeTabKey, semester, data]);

  const renderSummaryMetrics = (item, label, showLabel = true) => {
    if (!item) return null;
    const isSuccess = (item['Total Attendance'] || 0) >= 75;

    return (
      <View style={styles.summaryBlock}>
        {showLabel && (
          <View style={styles.summaryBlockHeader}>
            <Text style={styles.summaryBlockLabel}>{label}</Text>
            <View
              style={[
                styles.summaryCardBadge,
                !isSuccess && styles.summaryCardBadgeWarning,
              ]}
            >
              <Text
                style={[
                  styles.summaryCardBadgeText,
                  !isSuccess && styles.summaryCardBadgeTextWarning,
                ]}
              >
                {item['Total Attendance']}%
              </Text>
            </View>
          </View>
        )}

        <View style={styles.summaryMetricsRow}>
          <View style={styles.summaryMetricItem}>
            <Text style={styles.summaryMetricLabel}>Present</Text>
            <Text style={[styles.summaryMetricVal, styles.statPresent]}>
              {item['Presentees']}
            </Text>
          </View>
          <View style={styles.summaryMetricDivider} />
          <View style={styles.summaryMetricItem}>
            <Text style={styles.summaryMetricLabel}>Absent</Text>
            <Text style={[styles.summaryMetricVal, styles.statAbsent]}>
              {item['Abscentees']}
            </Text>
          </View>
          <View style={styles.summaryMetricDivider} />
          <View style={styles.summaryMetricItem}>
            <Text style={styles.summaryMetricLabel}>Extra</Text>
            <Text style={[styles.summaryMetricVal, styles.statExtra]}>
              {item['Extra Classes']}
            </Text>
          </View>
          <View style={styles.summaryMetricDivider} />
          <View style={styles.summaryMetricItem}>
            <Text style={styles.summaryMetricLabel}>Total</Text>
            <Text style={styles.summaryMetricVal}>
              {item['Total Classes']}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPeriodCell = (period) => {
    if (!period || period.status === 'no_class' || !period.subject) {
      return (
        <View style={styles.periodCellEmpty}>
          <Text style={styles.emptyPeriodText}>-</Text>
        </View>
      );
    }

    const isPresent = period.status === 'present';

    return (
      <View
        style={[
          styles.periodPill,
          isPresent ? styles.periodPillPresent : styles.periodPillAbsent,
        ]}
      >
        <Text
          style={[
            styles.periodSubjectText,
            isPresent ? styles.textPresent : styles.textAbsent,
          ]}
          numberOfLines={1}
        >
          {period.subject}
        </Text>
      </View>
    );
  };

  const renderSummaryCard = () => {
    if (!attendanceSummary || (!attendanceSummary.regular && !attendanceSummary.eca)) return null;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <Text style={styles.summaryCardTitle}>Attendance Summary</Text>
          {!hasMultipleSummaries && (attendanceSummary.regular || attendanceSummary.eca) ? (
            <View
              style={[
                styles.summaryCardBadge,
                ((attendanceSummary.regular || attendanceSummary.eca)['Total Attendance'] || 0) < 75 &&
                  styles.summaryCardBadgeWarning,
              ]}
            >
              <Text
                style={[
                  styles.summaryCardBadgeText,
                  ((attendanceSummary.regular || attendanceSummary.eca)['Total Attendance'] || 0) < 75 &&
                    styles.summaryCardBadgeTextWarning,
                ]}
              >
                {(attendanceSummary.regular || attendanceSummary.eca)['Total Attendance']}%
              </Text>
            </View>
          ) : null}
        </View>

        {attendanceSummary.regular
          ? renderSummaryMetrics(
              attendanceSummary.regular,
              'Regular Attendance',
              hasMultipleSummaries
            )
          : null}

        {hasMultipleSummaries ? (
          <View style={styles.summarySectionDivider} />
        ) : null}

        {attendanceSummary.eca
          ? renderSummaryMetrics(
              attendanceSummary.eca,
              'ECA Attendance',
              hasMultipleSummaries
            )
          : null}
      </View>
    );
  };

  const renderDayWiseTable = () => {
    if (mainAttendance.length === 0) return null;

    const tableWidth = 36 + 90 + (periodHeaders.length * 86) + (4 * 38);

    return (
      <View style={[styles.adaptiveTableCard, { maxHeight: maxCardHeight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={[styles.tableBorderWrapper, { minWidth: tableWidth, maxHeight: maxCardHeight }]}>
            {/* Sticky Table Header */}
            <View style={styles.tableRowHeader}>
              <View style={[styles.cell, styles.colSno]}>
                <Text style={styles.headerText}>#</Text>
              </View>
              <View style={[styles.cell, styles.colDate]}>
                <Text style={styles.headerText}>Date</Text>
              </View>

              {periodHeaders.map((hdr, idx) => (
                <View key={idx} style={[styles.cell, styles.colPeriod]}>
                  <Text style={styles.headerText} numberOfLines={2}>
                    {hdr}
                  </Text>
                </View>
              ))}

              <View style={[styles.cell, styles.colStat]}>
                <Text style={styles.headerText}>OL</Text>
              </View>
              <View style={[styles.cell, styles.colStat]}>
                <Text style={styles.headerText}>Pre</Text>
              </View>
              <View style={[styles.cell, styles.colStat]}>
                <Text style={styles.headerText}>Abs</Text>
              </View>
              <View style={[styles.cell, styles.colStat]}>
                <Text style={styles.headerText}>Tot</Text>
              </View>
            </View>

            {/* Vertically Scrollable Rows with adaptive maxHeight */}
            <ScrollView
              ref={dayWiseScrollRef}
              style={{ maxHeight: maxCardHeight - 38 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              onContentSizeChange={(w, h) => {
                if (h > maxCardHeight - 38 && !hasScrolledDayWise.current) {
                  dayWiseScrollRef.current?.scrollToEnd({ animated: false });
                  hasScrolledDayWise.current = true;
                }
              }}
            >
              {mainAttendance.map((row, rIdx) => (
                <View
                  key={row.sno || rIdx}
                  style={[
                    styles.tableRow,
                    rIdx % 2 === 1 && styles.tableRowAlt,
                  ]}
                >
                  <View style={[styles.cell, styles.colSno]}>
                    <Text style={styles.cellTextSno}>{row.sno}</Text>
                  </View>
                  <View style={[styles.cell, styles.colDate]}>
                    <Text style={styles.cellTextDate}>{row.date}</Text>
                  </View>

                  {row.periods.map((p, pIdx) => (
                    <View key={pIdx} style={[styles.cell, styles.colPeriod]}>
                      {renderPeriodCell(p)}
                    </View>
                  ))}

                  <View style={[styles.cell, styles.colStat]}>
                    <Text style={styles.statOl}>{row.ol || '-'}</Text>
                  </View>
                  <View style={[styles.cell, styles.colStat]}>
                    <Text style={styles.statPresent}>{row.present}</Text>
                  </View>
                  <View style={[styles.cell, styles.colStat]}>
                    <Text style={styles.statAbsent}>{row.absent}</Text>
                  </View>
                  <View style={[styles.cell, styles.colStat]}>
                    <Text style={styles.statTotal}>{row.total}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderSubjectSummaryTable = () => {
    if (subjectSummary.length === 0) return null;

    const tableWidth = 130 + (4 * 55) + 65;

    return (
      <View style={[styles.adaptiveTableCard, { maxHeight: maxCardHeight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={[styles.tableBorderWrapper, { minWidth: tableWidth, maxHeight: maxCardHeight }]}>
            {/* Sticky Subject Header */}
            <View style={styles.tableRowHeader}>
              <View style={[styles.cell, styles.colSubjectName]}>
                <Text style={styles.headerText}>Subject</Text>
              </View>
              <View style={[styles.cell, styles.colMetric]}>
                <Text style={styles.headerText}>Held</Text>
              </View>
              <View style={[styles.cell, styles.colMetric]}>
                <Text style={styles.headerText}>Present</Text>
              </View>
              <View style={[styles.cell, styles.colMetric]}>
                <Text style={styles.headerText}>Absent</Text>
              </View>
              <View style={[styles.cell, styles.colMetric]}>
                <Text style={styles.headerText}>Extra</Text>
              </View>
              <View style={[styles.cell, styles.colMetricPct]}>
                <Text style={styles.headerText}>Att. %</Text>
              </View>
            </View>

            {/* Vertically Scrollable Rows with adaptive maxHeight */}
            <ScrollView
              style={{ maxHeight: maxCardHeight - 38 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {subjectSummary.map((sub, sIdx) => (
                <View
                  key={sIdx}
                  style={[
                    styles.tableRow,
                    sIdx % 2 === 1 && styles.tableRowAlt,
                  ]}
                >
                  <View style={[styles.cell, styles.colSubjectName]}>
                    <Text style={styles.subjectRowName} numberOfLines={2}>
                      {sub.subject}
                    </Text>
                  </View>
                  <View style={[styles.cell, styles.colMetric]}>
                    <Text style={styles.cellTextGeneral}>{sub.held}</Text>
                  </View>
                  <View style={[styles.cell, styles.colMetric]}>
                    <Text style={styles.statPresent}>{sub.present}</Text>
                  </View>
                  <View style={[styles.cell, styles.colMetric]}>
                    <Text style={styles.statAbsent}>{sub.absent}</Text>
                  </View>
                  <View style={[styles.cell, styles.colMetric]}>
                    <Text style={styles.statExtra}>{sub.extra}</Text>
                  </View>
                  <View style={[styles.cell, styles.colMetricPct]}>
                    <Text
                      style={[
                        styles.statPct,
                        sub.percentage >= 75 ? styles.textPresent : styles.textAbsent,
                      ]}
                    >
                      {sub.percentage}%
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAdditionalAttendanceTable = () => {
    if (additionalAttendance.length === 0) return null;

    const tableWidth = 36 + 90 + (periodHeaders.length * 86) + 90;

    return (
      <View style={[styles.adaptiveTableCard, { maxHeight: maxCardHeight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={[styles.tableBorderWrapper, { minWidth: tableWidth, maxHeight: maxCardHeight }]}>
            {/* Sticky Table Header */}
            <View style={styles.tableRowHeader}>
              <View style={[styles.cell, styles.colSno]}>
                <Text style={styles.headerText}>#</Text>
              </View>
              <View style={[styles.cell, styles.colDate]}>
                <Text style={styles.headerText}>Date</Text>
              </View>
              {periodHeaders.map((hdr, idx) => (
                <View key={idx} style={[styles.cell, styles.colPeriod]}>
                  <Text style={styles.headerText} numberOfLines={2}>
                    {hdr}
                  </Text>
                </View>
              ))}
              <View style={[styles.cell, styles.colAdditionalPre]}>
                <Text style={styles.headerText}>Day Wise Pre</Text>
              </View>
            </View>

            {/* Vertically Scrollable Rows with adaptive maxHeight */}
            <ScrollView
              ref={additionalScrollRef}
              style={{ maxHeight: maxCardHeight - 38 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              onContentSizeChange={(w, h) => {
                if (h > maxCardHeight - 38 && !hasScrolledAdditional.current) {
                  additionalScrollRef.current?.scrollToEnd({ animated: false });
                  hasScrolledAdditional.current = true;
                }
              }}
            >
              {additionalAttendance.map((aRow, aIdx) => (
                <View
                  key={aRow.sno || aIdx}
                  style={[
                    styles.tableRow,
                    aIdx % 2 === 1 && styles.tableRowAlt,
                  ]}
                >
                  <View style={[styles.cell, styles.colSno]}>
                    <Text style={styles.cellTextSno}>{aRow.sno}</Text>
                  </View>
                  <View style={[styles.cell, styles.colDate]}>
                    <Text style={styles.cellTextDate}>{aRow.date}</Text>
                  </View>
                  {aRow.periods.map((ap, apIdx) => (
                    <View key={apIdx} style={[styles.cell, styles.colPeriod]}>
                      {renderPeriodCell(ap)}
                    </View>
                  ))}
                  <View style={[styles.cell, styles.colAdditionalPre]}>
                    <Text style={styles.statPresent}>{aRow.dayWisePre || '-'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Native Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSubtitle}>
            Semester {semester?.semester || ''} ({semester?.academicYear || ''})
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading attendance timetable...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Failed to load attendance</Text>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry ? (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : !data || !data.available || availableTabs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Attendance Details Unavailable</Text>
          <Text style={styles.emptySubtext}>
            {data?.reason || 'Detailed day-wise or subject attendance records are not published yet.'}
          </Text>
          {onRetry ? (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {/* Summary Period Banner */}
          {data.summaryPeriod ? (
            <View style={styles.periodBanner}>
              <Text style={styles.periodBannerText}>{data.summaryPeriod}</Text>
            </View>
          ) : null}

          {/* Apple-Style Segmented View Switcher: Day-Wise -> Subject-Wise -> Additional -> Summary */}
          {availableTabs.length > 1 ? (
            <View style={styles.segmentedContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.segmentedScrollContent}
              >
                {availableTabs.map((tab) => {
                  const isActive = activeTabKey === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.segmentedTab, isActive && styles.segmentedTabActive]}
                      onPress={() => setSelectedTab(tab.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.segmentedTabText,
                          isActive && styles.segmentedTabTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : availableTabs.length === 1 ? (
            <View style={styles.singleTabHeader}>
              <Text style={styles.singleTabTitle}>{availableTabs[0].label}</Text>
            </View>
          ) : null}

          {/* Active Section */}
          <View style={styles.activeTableSection}>
            {activeTabKey === 'daywise' && renderDayWiseTable()}
            {activeTabKey === 'subjects' && renderSubjectSummaryTable()}
            {activeTabKey === 'additional' && renderAdditionalAttendanceTable()}
            {activeTabKey === 'summary' && renderSummaryCard()}
          </View>
        </ScrollView>
      )}
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
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryText,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 1,
  },
  headerPlaceholder: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.destructive,
  },
  errorText: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 6,
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  periodBanner: {
    backgroundColor: '#EBF5FF',
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  periodBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  segmentedContainer: {
    backgroundColor: '#E5E5EA',
    borderRadius: radius.full,
    padding: 3,
    marginBottom: 8,
  },
  segmentedScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentedTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabActive: {
    backgroundColor: colors.card,
    ...shadows.subtle,
  },
  segmentedTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
    letterSpacing: -0.2,
  },
  segmentedTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  singleTabHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  singleTabTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.3,
  },
  activeTableSection: {
    width: '100%',
    marginBottom: 0,
  },
  adaptiveTableCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    overflow: 'hidden',
    width: '100%',
  },
  sectionContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.md,
  },
  horizontalScroll: {
    marginTop: 0,
  },
  tableBorderWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeaderBg,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tableRowAlt: {
    backgroundColor: colors.cardAlt,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  colSno: {
    width: 36,
  },
  colDate: {
    width: 90,
    alignItems: 'flex-start',
    paddingLeft: 6,
  },
  colPeriod: {
    width: 86,
  },
  colStat: {
    width: 38,
  },
  colAdditionalPre: {
    width: 90,
  },
  colSubjectName: {
    width: 130,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  colMetric: {
    width: 55,
  },
  colMetricPct: {
    width: 65,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.tableHeaderText,
    textAlign: 'center',
  },
  cellTextSno: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  cellTextDate: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primaryText,
  },
  cellTextGeneral: {
    fontSize: 11,
    color: colors.primaryText,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  subjectRowName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryText,
  },
  periodPill: {
    width: 78,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillPresent: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: '#C3E6CB',
  },
  periodPillAbsent: {
    backgroundColor: colors.destructiveBg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  periodSubjectText: {
    fontSize: 10,
    fontWeight: '600',
  },
  textPresent: {
    color: colors.successText,
  },
  textAbsent: {
    color: colors.destructiveText,
  },
  periodCellEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPeriodText: {
    fontSize: 12,
    color: colors.tertiaryText,
  },
  statOl: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  statPresent: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successText,
    fontVariant: ['tabular-nums'],
  },
  statAbsent: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.destructiveText,
    fontVariant: ['tabular-nums'],
  },
  statTotal: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
  },
  statExtra: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  statPct: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: colors.primaryText,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.2,
  },
  summaryCardBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  summaryCardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
    fontVariant: ['tabular-nums'],
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.base,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  summaryMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryMetricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  summaryMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  summaryBlock: {},
  summaryBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryBlockLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  summarySectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryCardBadgeWarning: {
    backgroundColor: colors.destructiveBg,
  },
  summaryCardBadgeTextWarning: {
    color: colors.destructiveText,
  },
});
