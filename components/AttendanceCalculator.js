import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, radius, shadows, spacing } from '../theme.js';
import { computeAttendanceResult } from '../calculator/attendanceCalculator.js';

// SVG Icons
function CheckCircleIcon({ size = 18, color = colors.successText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertCircleIcon({ size = 18, color = colors.destructiveText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpIcon({ size = 18, color = colors.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <Path d="M23 6l-9.5 9.5-5-5L1 18" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TargetIcon({ size = 16, color = colors.secondaryText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="6" />
      <Circle cx="12" cy="12" r="2" />
    </Svg>
  );
}

function CalendarCheckIcon({ size = 20, color = colors.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Compact Native Donut Ring
function NativeDonutRing({ percentage, mainColor, trackColor }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let start = null;
    let frameId = null;
    const duration = 650;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setAnimatedValue(percentage * progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [percentage]);

  const size = 132;
  const strokeWidth = 16;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <View style={styles.ringWrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Animated Progress Stroke */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={mainColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>

        {/* Centered Hero Percentage */}
        <View style={styles.ringTextOverlay}>
          <Text style={styles.heroPercentText}>
            {animatedValue.toFixed(1)}%
          </Text>
          <Text style={styles.heroPercentLabel}>Attendance</Text>
        </View>
      </View>
    </View>
  );
}

// Single Category Attendance Card View
function AttendanceCard({ category, label, data }) {
  const [target, setTarget] = useState('75');
  const [isFocused, setIsFocused] = useState(false);

  const totalClasses = Number(data?.['Total Classes'] || 0);
  const presentees = Number(data?.['Presentees'] || 0);
  const extra = Number(data?.['Extra Classes'] || 0);
  const attended = presentees + extra;
  const absentees = Math.max(0, totalClasses - attended);

  const currentPercent = totalClasses > 0 ? (attended / totalClasses) * 100 : 0;

  // Semantic Colors
  const getStateColor = (pct) => {
    if (pct > 85) return colors.success; // #34C759
    if (pct >= 75) return colors.warning; // #FF9500
    return colors.destructive; // #FF3B30
  };

  const mainColor = getStateColor(currentPercent);
  const trackColor = colors.border; // #E5E5EA

  const result = computeAttendanceResult({
    category,
    totalClasses,
    attended,
    target,
  });

  return (
    <View style={styles.card}>
      {/* Category Header with Semantic Status Pill */}
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.categoryTitle}>{label}</Text>
          
        </View>

        <View
          style={[
            styles.statusPill,
            currentPercent >= 90
              ? styles.pillExcellent
              : currentPercent >= 75
              ? styles.pillGood
              : styles.pillLow,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              currentPercent >= 90
                ? styles.textExcellent
                : currentPercent >= 75
                ? styles.textGood
                : styles.textLow,
            ]}
          >
            {currentPercent >= 90 ? 'Excellent' : currentPercent >= 75 ? 'Good' : 'Low'}
          </Text>
        </View>
      </View>

      {/* Centered Donut Ring */}
      <NativeDonutRing
        percentage={currentPercent}
        mainColor={mainColor}
        trackColor={trackColor}
      />

      

      {/* Metrics Breakdown Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Present</Text>
          <Text style={[styles.metricValue, styles.metricPresent]}>
            {presentees}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Absent</Text>
          <Text style={[styles.metricValue, styles.metricAbsent]}>
            {absentees}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Extra</Text>
          <Text style={[styles.metricValue, styles.metricExtra]}>
            {extra}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total</Text>
          <Text style={styles.metricValue}>{totalClasses}</Text>
        </View>
      </View>

      {/* Card Section Separator */}
      <View style={styles.separator} />

      {/* Target Attendance Calculator Row */}
      <View style={styles.calculatorSection}>
        <View style={styles.calculatorHeaderRow}>
          <View style={styles.calculatorTitleGroup}>
            <TargetIcon size={16} color={colors.secondaryText} />
            <Text style={styles.calculatorLabel}>Target Attendance</Text>
          </View>

          {/* Native Styled Input */}
          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              maxLength={3}
              placeholder="75"
              placeholderTextColor={colors.tertiaryText}
              value={target}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChangeText={(val) => {
                if (val === '') {
                  setTarget('');
                  return;
                }
                const num = Number(val);
                if (!isNaN(num)) {
                  setTarget(String(Math.max(0, Math.min(100, Math.round(num)))));
                }
              }}
            />
            <Text style={styles.inputPercentSign}>%</Text>
          </View>
        </View>

        {/* Informational Callout Box */}
        <View style={styles.resultContainer}>
          {!target || target.trim() === '' ? (
            <View style={styles.calloutEmpty}>
              <Text style={styles.calloutEmptyText}>
                Set a target percentage to calculate projection.
              </Text>
            </View>
          ) : result?.mode === 'bunk' ? (
            <View style={styles.calloutBunk}>
              <CheckCircleIcon size={18} color={colors.successText} />
              <Text style={styles.calloutBunkText}>
                You can bunk {result.count} classes
              </Text>
            </View>
          ) : result?.mode === 'attend' ? (
            <View style={styles.calloutAttend}>
              <TrendingUpIcon size={18} color={colors.primary} />
              <Text style={styles.calloutAttendText}>
                You need {result.count} more classes
              </Text>
            </View>
          ) : (
            <View style={styles.calloutUnreachable}>
              <AlertCircleIcon size={18} color={colors.destructiveText} />
              <Text style={styles.calloutUnreachableText}>
                Target not attainable
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Loading Skeleton Placeholder Card
function AttendanceCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View>
          <View style={styles.skeletonBarTitle} />
          <View style={styles.skeletonBarSubtitle} />
        </View>
        <View style={styles.skeletonPill} />
      </View>

      <View style={styles.skeletonRingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.skeletonText}>Loading attendance data...</Text>
      </View>

      <View style={styles.skeletonProgressBar} />

      <View style={styles.metricsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.metricItem}>
            <View style={styles.skeletonMetricNum} />
            <View style={styles.skeletonMetricLbl} />
          </View>
        ))}
      </View>

      <View style={styles.separator} />

      <View style={styles.calculatorSection}>
        <View style={styles.skeletonCalcRow}>
          <View style={styles.skeletonCalcLabel} />
          <View style={styles.skeletonInputBox} />
        </View>
      </View>
    </View>
  );
}

// Attendance Overview Container with Centered Paging Carousel
export default function AttendanceCalculator({
  attendanceData,
  loading = false,
  error = null,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const categories = [];

  if (attendanceData?.regular) {
    categories.push({
      key: 'Regular',
      label: 'Regular Attendance',
      data: attendanceData.regular,
    });
  }

  if (attendanceData?.eca) {
    categories.push({
      key: 'ECA',
      label: 'ECA Attendance',
      data: attendanceData.eca,
    });
  }

  // Width of each card inside its screenWidth container
  const CARD_WIDTH = screenWidth - 32;

  // Render Skeleton when loading and no data yet
  if (loading && categories.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <CalendarCheckIcon size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Attendance Overview</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Current semester</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.base }}>
          <AttendanceCardSkeleton />
        </View>
      </View>
    );
  }

  // Render Error state if data failed to load
  if (error && categories.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <CalendarCheckIcon size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Attendance Overview</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: spacing.base }}>
          <View style={[styles.card, { alignItems: 'center', padding: spacing.xl }]}>
            <AlertCircleIcon size={24} color={colors.destructive} />
            <Text style={[styles.categoryTitle, { marginTop: 8, color: colors.destructive }]}>
              Attendance Unavailable
            </Text>
            <Text style={[styles.classesRatioSubtitle, { textAlign: 'center', marginTop: 4 }]}>
              {error}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header with Segmented Category Tabs if > 1 category */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleGroup}>
          
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Attendance Calculator
          </Text>
        </View>

        {/* Category Switcher Tabs for quick selection */}
        {categories.length > 1 ? (
          <View style={styles.tabSwitcher}>
            {categories.map((cat, idx) => {
              const isActive = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.tabButton,
                    isActive && styles.tabButtonActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    scrollRef.current?.scrollTo({
                      x: idx * screenWidth,
                      animated: true,
                    });
                    setActiveIndex(idx);
                  }}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive && styles.tabButtonTextActive,
                    ]}
                  >
                    {cat.key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.sectionSubtitle}>Current semester</Text>
        )}
      </View>

      {/* Single Category: Full Width Display */}
      {categories.length === 1 ? (
        <View style={{ paddingHorizontal: spacing.base }}>
          <AttendanceCard
            category={categories[0].key}
            label={categories[0].label}
            data={categories[0].data}
          />
        </View>
      ) : (
        /* Multiple Categories: Centered Paging Carousel with Focused Enlargement */
        <View>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              {
                useNativeDriver: true,
                listener: (e) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(offsetX / screenWidth);
                  if (idx >= 0 && idx < categories.length && idx !== activeIndex) {
                    setActiveIndex(idx);
                  }
                },
              }
            )}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / screenWidth);
              if (idx >= 0 && idx < categories.length) {
                setActiveIndex(idx);
              }
            }}
            scrollEventThrottle={16}
          >
            {categories.map((cat, i) => {
              const inputRange = [
                (i - 1) * screenWidth,
                i * screenWidth,
                (i + 1) * screenWidth,
              ];

              // Enlarges currently watched card to 1.0; scales adjacent cards to 0.93
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.93, 1.0, 0.93],
                extrapolate: 'clamp',
              });

              // Subtle contrast opacity for adjacent cards
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.75, 1.0, 0.75],
                extrapolate: 'clamp',
              });

              return (
                <View
                  key={cat.key}
                  style={[
                    styles.carouselSlide,
                    { width: screenWidth },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.carouselCardWrapper,
                      {
                        width: CARD_WIDTH,
                        transform: [{ scale }],
                        opacity,
                      },
                    ]}
                  >
                    <AttendanceCard
                      category={cat.key}
                      label={cat.label}
                      data={cat.data}
                    />
                  </Animated.View>
                </View>
              );
            })}
          </Animated.ScrollView>

          {/* Pagination Dots Indicator */}
          <View style={styles.paginationContainer}>
            {categories.map((cat, idx) => {
              const isActive = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => {
                    scrollRef.current?.scrollTo({
                      x: idx * screenWidth,
                      animated: true,
                    });
                    setActiveIndex(idx);
                  }}
                  style={[
                    styles.paginationDot,
                    isActive && styles.paginationDotActive,
                  ]}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryText,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
  },

  // Switcher Tabs (Enlarged iOS-Style Segmented Control)
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: radius.full,
    padding: 3,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.full,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.card,
    ...shadows.subtle,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
    letterSpacing: -0.2,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Carousel Page & Wrapper
  carouselSlide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  carouselCardWrapper: {
    alignSelf: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D1D1D6',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },

  // Card Structure
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    width: '100%',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryText,
    letterSpacing: 0.8,
  },
  classesRatioSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 2,
  },

  // Status Pills
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pillExcellent: {
    backgroundColor: colors.successBg,
  },
  textExcellent: {
    color: colors.successText,
  },
  pillGood: {
    backgroundColor: colors.warningBg,
  },
  textGood: {
    color: colors.warningText,
  },
  pillLow: {
    backgroundColor: colors.destructiveBg,
  },
  textLow: {
    color: colors.destructiveText,
  },

  // Donut Ring
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  ringTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPercentText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  heroPercentLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '500',
    marginTop: -2,
  },

  // Progress Bar
  progressTrack: {
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    borderRadius: radius.base,
    paddingVertical: 9,
    paddingHorizontal: 4,
    marginVertical: spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  metricPresent: {
    color: colors.successText,
  },
  metricAbsent: {
    color: colors.destructiveText,
  },
  metricExtra: {
    color: colors.primary,
  },
  metricDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  // Calculator Section
  calculatorSection: {
    marginTop: 4,
  },
  calculatorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  calculatorTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calculatorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralButton,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    height: 34,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  textInput: {
    width: 38,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    paddingVertical: 0,
  },
  inputPercentSign: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },

  // Callout Boxes
  resultContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  calloutEmpty: {
    backgroundColor: colors.neutralButton,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  calloutEmptyText: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  calloutBunk: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderColor: '#C3E6CB',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: 8,
  },
  calloutBunkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.successText,
    flex: 1,
  },
  calloutAttend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: 8,
  },
  calloutAttendText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  calloutUnreachable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.destructiveBg,
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: 8,
  },
  calloutUnreachableText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.destructiveText,
    flex: 1,
  },

  // Skeleton Styles
  skeletonBarTitle: {
    width: 120,
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonBarSubtitle: {
    width: 160,
    height: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
  },
  skeletonPill: {
    width: 54,
    height: 20,
    backgroundColor: '#E5E5EA',
    borderRadius: radius.full,
  },
  skeletonRingContainer: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 8,
    fontWeight: '500',
  },
  skeletonProgressBar: {
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: radius.full,
    marginVertical: spacing.xs,
  },
  skeletonMetricNum: {
    width: 24,
    height: 14,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginBottom: 4,
  },
  skeletonMetricLbl: {
    width: 32,
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
  },
  skeletonCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  skeletonCalcLabel: {
    width: 110,
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  skeletonInputBox: {
    width: 50,
    height: 30,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
  },
});
