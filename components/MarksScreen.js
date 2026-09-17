import React from 'react';
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
import { colors, radius, shadows, spacing } from '../theme.js';

export default function MarksScreen({
  semester,
  data,
  loading = false,
  error = null,
  onBack,
  onRetry,
}) {
  const assessmentGroups = data?.assessmentGroups || [];
  const columns = data?.columns || [];
  const rows = data?.rows || [];
  const totalRow = data?.totalRow;
  const percentageRow = data?.percentageRow;
  const sgpa = data?.sgpa;

  // Compute adaptive max height with comfortable bottom padding to prevent curved screen edges from blocking elements
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const bottomPadding = Math.max(96, (insets?.bottom || 0) + 64);
  const maxTableHeight = Math.max(220, windowHeight - 48 /* top nav bar */ - 16 /* top spacing */ - bottomPadding);

  // The first two columns (id 0: S.No, id 1: Subject Name) are pinned/sticky
  const scrollableColumns = columns.length > 2 ? columns.slice(2) : [];

  // Determine cell width for scrollable marks columns
  const getColWidth = (col) => {
    const lower = (col.sub || col.label || '').toLowerCase();
    if (lower.indexOf('grade') !== -1 && lower.indexOf('point') === -1) return 60;
    if (lower.indexOf('credit') !== -1) return 68;
    if (lower.indexOf('point') !== -1) return 68;
    return 68; // Assessment marks numbers
  };

  // Grade Chip styling helper
  const isGradeCol = (col) => {
    const lower = (col.sub || col.label || '').toLowerCase();
    return lower.indexOf('grade') !== -1 && lower.indexOf('point') === -1;
  };

  const getGradeStyle = (val) => {
    const v = String(val || '').trim().toUpperCase();
    if (v === 'O' || v === 'A+') {
      return { bg: '#E8F8ED', text: '#1E7E34', border: '#C3E6CB' };
    }
    if (v === 'A' || v === 'B+') {
      return { bg: '#EBF5FF', text: '#007AFF', border: '#BFDBFE' };
    }
    if (v === 'B' || v === 'C' || v === 'P') {
      return { bg: '#FFF6E5', text: '#9A5B00', border: '#FFE0B2' };
    }
    if (v === 'F' || v === 'AB') {
      return { bg: '#FFF2F2', text: '#D70015', border: '#FECACA' };
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* iOS Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Semester Marks</Text>
          <Text style={styles.headerSubtitle}>
            Semester {semester?.semester || ''} {semester?.academicYear ? `(${semester.academicYear})` : ''}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {sgpa !== null && sgpa !== undefined && String(sgpa) !== '-' ? (
            <View style={styles.headerSgpaBadge}>
              <Text style={styles.headerSgpaText}>SGPA {sgpa}</Text>
            </View>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>
      </View>

      {/* Screen Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching semester marks...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Failed to load marks</Text>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry ? (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : !data || !data.available || rows.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Marks not available</Text>
            <Text style={styles.emptySubtext}>
              {data?.reason || 'Marks have not been uploaded or published for this semester yet.'}
            </Text>
            {onRetry ? (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : (
        <ScrollView
          style={[styles.scrollContainer, { maxHeight: maxTableHeight }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={true}
        >
          {/* Compact iOS Blue Marks Table with Sticky Subject Columns */}
          <View style={styles.tableCard}>
            {/* Table Header Bar */}
            

            {/* Table Body: Frozen Left Columns + Horizontally Scrollable Marks */}
            <View style={styles.tableFlexRow}>
              {/* 1. FROZEN / STICKY LEFT SECTION (S.No + Subject Name) */}
              <View style={styles.frozenContainer}>
                {/* Frozen Two-Level Header (Height 48) */}
                <View style={styles.frozenHeaderRow}>
                  <View style={styles.frozenSnoHeader}>
                    <Text style={styles.headerText}>S.No</Text>
                  </View>
                  <View style={styles.frozenSubjectHeader}>
                    <Text style={styles.headerText}>Subject Name</Text>
                  </View>
                </View>

                {/* Frozen Rows (Height 36) */}
                {rows.map((row, rIdx) => {
                  const isAlt = rIdx % 2 === 1;
                  const sNoVal = row.s_no || (row.values ? row.values[0] : rIdx + 1);
                  const subName = row.name || (row.values ? row.values[1] : '');

                  return (
                    <View
                      key={row.s_no || rIdx}
                      style={[styles.frozenDataRow, isAlt && styles.rowAlt]}
                    >
                      <View style={styles.frozenSnoCell}>
                        <View style={styles.snoPill}>
                          <Text style={styles.snoPillText}>{sNoVal}</Text>
                        </View>
                      </View>
                      <View style={styles.frozenSubjectCell}>
                        <Text style={styles.subjectNameText} numberOfLines={2}>
                          {subName}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Frozen Total Row (Height 32) */}
                {totalRow && totalRow.length > 0 ? (
                  <View style={styles.frozenSummaryRowTotal}>
                    <View style={styles.frozenSummaryCell}>
                      <Text style={styles.totalLabelText}>Total</Text>
                    </View>
                  </View>
                ) : null}

                {/* Frozen Percentage Row (Height 32) */}
                {percentageRow && percentageRow.length > 0 ? (
                  <View style={styles.frozenSummaryRowPercentage}>
                    <View style={styles.frozenSummaryCell}>
                      <Text style={styles.percentageLabelText}>Percentage</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* 2. HORIZONTALLY SCROLLABLE MARKS SECTION */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                bounces={false}
                style={styles.scrollableRightScrollView}
              >
                <View>
                  {/* Two-Level Header for Assessment Groups (Height 48) */}
                  <View style={styles.rightHeaderContainer}>
                    {assessmentGroups.length > 0 ? (
                      assessmentGroups.map((group, gIdx) => {
                        const groupWidth = group.cols.reduce(
                          (acc, col) => acc + getColWidth(col),
                          0
                        );

                        return (
                          <View
                            key={gIdx}
                            style={[styles.groupColumnContainer, { width: groupWidth }]}
                          >
                            {/* Top Group Header (Height 25, Vibrant iOS Blue #007AFF) */}
                            <View style={styles.groupTopHeader}>
                              <Text style={styles.headerText} numberOfLines={1}>
                                {group.name}
                              </Text>
                            </View>

                            {/* Sub-Headers Row (Height 23, Deeper iOS Blue #0062CC) */}
                            <View style={styles.groupSubHeadersRow}>
                              {group.cols.map((c, cIdx) => (
                                <View
                                  key={cIdx}
                                  style={[
                                    styles.subHeaderCell,
                                    { width: getColWidth(c) },
                                  ]}
                                >
                                  <Text style={styles.subHeaderText} numberOfLines={1}>
                                    {c.sub}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      // Fallback if no assessment groups are grouped
                      <View style={styles.groupSubHeadersRow}>
                        {scrollableColumns.map((col, cIdx) => (
                          <View
                            key={cIdx}
                            style={[
                              styles.subHeaderCell,
                              { width: getColWidth(col), height: 52 },
                            ]}
                          >
                            <Text style={styles.subHeaderText} numberOfLines={1}>
                              {col.sub || col.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Scrollable Data Rows (Height 36) */}
                  {rows.map((row, rIdx) => {
                    const isAlt = rIdx % 2 === 1;

                    return (
                      <View
                        key={row.s_no || rIdx}
                        style={[styles.rightDataRow, isAlt && styles.rowAlt]}
                      >
                        {scrollableColumns.map((col, idx) => {
                          const cIdx = idx + 2;
                          const cellVal = row.values ? row.values[cIdx] : '';
                          const isGrade = isGradeCol(col);
                          const gradeStyle = isGrade ? getGradeStyle(cellVal) : null;
                          const width = getColWidth(col);

                          return (
                            <View
                              key={cIdx}
                              style={[styles.rightDataCell, { width }]}
                            >
                              {isGrade && gradeStyle ? (
                                <View
                                  style={[
                                    styles.gradeChip,
                                    {
                                      backgroundColor: gradeStyle.bg,
                                      borderColor: gradeStyle.border,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.gradeChipText,
                                      { color: gradeStyle.text },
                                    ]}
                                  >
                                    {cellVal}
                                  </Text>
                                </View>
                              ) : (
                                <Text
                                  style={[
                                    styles.cellText,
                                    cellVal === '-' && styles.dashText,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {cellVal ?? '-'}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}

                  {/* Scrollable Total Row (Height 32) */}
                  {totalRow && totalRow.length > 0 ? (
                    <View style={styles.rightSummaryRowTotal}>
                      {scrollableColumns.map((col, idx) => {
                        const cIdx = idx + 2;
                        const val = totalRow[cIdx] ?? '';
                        const width = getColWidth(col);

                        return (
                          <View
                            key={cIdx}
                            style={[styles.rightDataCell, styles.summaryCell, { width }]}
                          >
                            <Text style={styles.totalCellText} numberOfLines={1}>
                              {val}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Scrollable Percentage Row (Height 38) */}
                  {percentageRow && percentageRow.length > 0 ? (
                    <View style={styles.rightSummaryRowPercentage}>
                      {assessmentGroups && assessmentGroups.length > 0
                        ? assessmentGroups.map((group, gIdx) => {
                            const groupWidth = group.cols.reduce(
                              (acc, col) => acc + getColWidth(col),
                              0
                            );
                            const firstCol = group.cols[0];
                            const val = firstCol ? (percentageRow[firstCol.id] ?? '') : '';

                            return (
                              <View
                                key={gIdx}
                                style={[
                                  styles.rightDataCell,
                                  styles.summaryCell,
                                  { width: groupWidth },
                                ]}
                              >
                                <Text style={styles.percentageCellText} numberOfLines={1}>
                                  {val}
                                </Text>
                              </View>
                            );
                          })
                        : scrollableColumns.map((col, idx) => {
                            const cIdx = idx + 2;
                            const val = percentageRow[cIdx] ?? '';
                            const width = getColWidth(col);

                            return (
                              <View
                                key={cIdx}
                                style={[
                                  styles.rightDataCell,
                                  styles.summaryCell,
                                  { width },
                                ]}
                              >
                                <Text style={styles.percentageCellText} numberOfLines={1}>
                                  {val}
                                </Text>
                              </View>
                            );
                          })}
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            </View>
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
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 10,
  },
  backButtonText: {
    fontSize: 16,
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
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  headerSgpaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  headerSgpaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    ...shadows.card,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Table Card
  tableCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  tableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F0F6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  tableSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.primary,
  },
  tableScrollHint: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '500',
  },

  // Table Flex Row: Sticky Left + Scrollable Right
  tableFlexRow: {
    flexDirection: 'row',
  },

  // 1. FROZEN / STICKY LEFT COLUMN (Width 184)
  frozenContainer: {
    width: 184,
    backgroundColor: colors.card,
    zIndex: 10,
  },
  frozenHeaderRow: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.primary,
  },
  frozenSnoHeader: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 2,
  },
  frozenSubjectHeader: {
    width: 140,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Rows (Height 40)
  frozenDataRow: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  frozenSnoCell: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  snoPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  snoPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
  },
  frozenSubjectCell: {
    width: 140,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  subjectNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'left',
    lineHeight: 16,
  },

  // Summary Rows (Height 38)
  frozenSummaryRowTotal: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#F0F4F8',
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  frozenSummaryRowPercentage: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#EBF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  frozenSummaryCell: {
    justifyContent: 'center',
  },
  totalLabelText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  percentageLabelText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  // 2. HORIZONTALLY SCROLLABLE MARKS SECTION
  scrollableRightScrollView: {
    flex: 1,
    backgroundColor: colors.card,
  },
  rightHeaderContainer: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.primary,
  },
  groupColumnContainer: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.25)',
  },
  groupTopHeader: {
    height: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
  },
  groupSubHeadersRow: {
    flexDirection: 'row',
    height: 25,
    backgroundColor: '#0062CC',
  },
  subHeaderCell: {
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.18)',
  },
  subHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  rightDataRow: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  rowAlt: {
    backgroundColor: '#F9FAFB',
  },
  rightDataCell: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  dashText: {
    color: colors.tertiaryText,
  },
  gradeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  // Summary Rows on Right (Height 38)
  summaryCell: {
    height: 38,
  },
  rightSummaryRowTotal: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  rightSummaryRowPercentage: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  percentageCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
