import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { colors, radius, shadows, spacing } from '../theme.js';
import { computeAttendanceResult } from '../calculator/attendanceCalculator.js';
import SegmentedSwitcher from './SegmentedSwitcher.js';

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

// Multi-Segment Donut Ring Component with Interactive Leader Line Indicator
function MultiSegmentDonut({
  presentees,
  absentees,
  extra,
  currentPercent,
  selectedSegment,
  onSelectSegment,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    let start = null;
    let frameId = null;
    const duration = 650;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setAnimatedProgress(progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [presentees, absentees, extra]);

  // Responsive SVG canvas dimensions
  const svgWidth = Math.min(Math.max(windowWidth - 40, 310), 360);
  const svgHeight = 215;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  const r = 64;
  const baseStrokeWidth = 18;
  const activeStrokeWidth = 24;
  const circumference = 2 * Math.PI * r;

  // Filter out zero-count categories completely
  const allSegments = [
    { key: 'present', label: 'Present', count: presentees, color: colors.success },
    { key: 'absent', label: 'Absent', count: absentees, color: colors.destructive },
    { key: 'extra', label: 'Extra', count: extra, color: colors.primary },
  ];
  const activeSegments = allSegments.filter((s) => s.count > 0);
  const totalCount = activeSegments.reduce((sum, s) => sum + s.count, 0);

  // Selected segment details
  const selectedInfo = activeSegments.find((s) => s.key === selectedSegment);

  // Scaled minimum arc allocation: guarantees even small categories (e.g. 1-2 extra classes) get a clearly visible arc
  const MIN_ARC = activeSegments.length > 1 ? 32 : 0;
  let allocatedMin = 0;
  let remainingCount = 0;

  const preCalculated = activeSegments.map((seg) => {
    const proportionalArc = totalCount > 0 ? (seg.count / totalCount) * circumference : 0;
    if (proportionalArc < MIN_ARC) {
      allocatedMin += MIN_ARC;
      return { ...seg, arcTarget: MIN_ARC, isClamped: true };
    }
    remainingCount += seg.count;
    return { ...seg, isClamped: false };
  });

  const remainingCircumference = Math.max(0, circumference - allocatedMin);

  const finalSegments = preCalculated.map((seg) => {
    if (seg.isClamped) return seg;
    const arcTarget = remainingCount > 0 ? (seg.count / remainingCount) * remainingCircumference : 0;
    return { ...seg, arcTarget };
  });

  // Calculate arc angles (in clock angle: 0 at 12 o'clock, clockwise in radians)
  let currentAngle = 0;
  const segmentedAngles = finalSegments.map((seg) => {
    const startAngle = currentAngle;
    const angleSpan = circumference > 0 ? (seg.arcTarget / circumference) * (2 * Math.PI) : 0;
    const endAngle = startAngle + angleSpan;
    const midAngle = startAngle + angleSpan / 2;
    currentAngle = endAngle;

    return {
      ...seg,
      startAngle,
      endAngle,
      midAngle,
      angleSpan,
      pct: totalCount > 0 ? ((seg.count / totalCount) * 100).toFixed(1) : '0.0',
    };
  });

  // Geometric Touch Handler: maps touch coordinates directly to donut segments
  const handleDonutPress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - cx;
    const dy = locationY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If tapped inside center hole: reset/dismiss
    if (dist < 44) {
      onSelectSegment(null);
      return;
    }

    // If tapped on the donut ring (generous 44px-90px hit band)
    if (dist >= 44 && dist <= 90) {
      let touchAngle = Math.atan2(dx, -dy);
      if (touchAngle < 0) touchAngle += 2 * Math.PI;

      // Find the segment whose angular span contains touchAngle
      const matched =
        segmentedAngles.find(
          (seg) => touchAngle >= seg.startAngle && touchAngle < seg.endAngle
        ) || segmentedAngles[segmentedAngles.length - 1];

      if (matched) {
        onSelectSegment(selectedSegment === matched.key ? null : matched.key);
      }
      return;
    }

    // If tapped outside donut ring
    if (selectedSegment) {
      onSelectSegment(null);
    }
  };

  // Render SVG arcs
  let renderedSegments = null;
  if (activeSegments.length === 1) {
    const singleSeg = activeSegments[0];
    const isSelected = selectedSegment === singleSeg.key;
    renderedSegments = (
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={singleSeg.color}
        strokeWidth={isSelected ? activeStrokeWidth : baseStrokeWidth}
      />
    );
  } else {
    const gapAngle = (3.5 / circumference) * (2 * Math.PI);
    renderedSegments = segmentedAngles.map((seg) => {
      const animatedSpan = seg.angleSpan * animatedProgress;
      const visibleSpan = Math.max(0.01, animatedSpan - gapAngle);
      const arcStart = seg.startAngle + gapAngle / 2;
      const arcEnd = arcStart + visibleSpan;

      const x1 = cx + r * Math.sin(arcStart);
      const y1 = cy - r * Math.cos(arcStart);
      const x2 = cx + r * Math.sin(arcEnd);
      const y2 = cy - r * Math.cos(arcEnd);
      const largeArc = visibleSpan > Math.PI ? 1 : 0;
      const pathD = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

      const isSelected = selectedSegment === seg.key;
      const strokeWidth = isSelected ? activeStrokeWidth : baseStrokeWidth;
      const opacity = selectedSegment && !isSelected ? 0.35 : 1;

      return (
        <Path
          key={seg.key}
          d={pathD}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity={opacity}
        />
      );
    });
  }

  // Interactive Callout Leader Line for Selected Segment
  const selectedMid = selectedSegment
    ? segmentedAngles.find((s) => s.key === selectedSegment)
    : null;
  let leaderLineElement = null;

  if (selectedInfo && selectedMid && animatedProgress > 0.4) {
    const alpha = selectedMid.midAngle;
    const sinA = Math.sin(alpha);
    const cosA = Math.cos(alpha);

    // Point 0: outer edge of donut slice
    const rOuter = r + activeStrokeWidth / 2;
    const x0 = cx + rOuter * sinA;
    const y0 = cy - rOuter * cosA;

    // Point 1: radially outward
    const radialDist = 14;
    const r1 = rOuter + radialDist;
    const rawX1 = cx + r1 * sinA;
    const y1 = cy - r1 * cosA;

    // Point 2: horizontal elbow arm
    const isRight = sinA >= 0;
    const clampedX1 = isRight ? Math.min(rawX1, svgWidth - 72) : Math.max(rawX1, 72);
    const elbowLength = 14;
    const x2 = isRight ? clampedX1 + elbowLength : clampedX1 - elbowLength;
    const y2 = y1;

    // Callout text placement
    const textX = isRight ? x2 + 5 : x2 - 5;
    const textAnchor = isRight ? 'start' : 'end';
    const countText = `${selectedInfo.count} ${selectedInfo.count === 1 ? 'class' : 'classes'}`;
    const subText = `${selectedInfo.label} (${selectedMid.pct}%)`;

    leaderLineElement = (
      <G key="leader-line">
        {/* Anchor Dot on Donut Arc Perimeter */}
        <Circle cx={x0} cy={y0} r={2.5} fill={selectedInfo.color} />

        {/* Elbow Leader Line */}
        <Path
          d={`M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${clampedX1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`}
          stroke={selectedInfo.color}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Callout Class Count Text */}
        <SvgText
          x={textX.toFixed(1)}
          y={(y2 - 2).toFixed(1)}
          textAnchor={textAnchor}
          fontSize={12}
          fontWeight="700"
          fill={selectedInfo.color}
        >
          {countText}
        </SvgText>

        {/* Callout Category & Percentage Subtitle */}
        <SvgText
          x={textX.toFixed(1)}
          y={(y2 + 11).toFixed(1)}
          textAnchor={textAnchor}
          fontSize={10}
          fontWeight="600"
          fill={colors.secondaryText}
        >
          {subText}
        </SvgText>
      </G>
    );
  }

  const centerHoleSize = 98;

  return (
    <Pressable
      onPress={handleDonutPress}
      style={[styles.donutRingWrapper, { width: svgWidth, height: svgHeight }]}
    >
      <Svg width={svgWidth} height={svgHeight} pointerEvents="none">
        {/* Background Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colors.border}
          strokeWidth={baseStrokeWidth}
        />
        {/* Distinct Segment Arcs */}
        {renderedSegments}
        {/* Callout Leader Line */}
        {leaderLineElement}
      </Svg>

      {/* Center Display Overlay */}
      <View
        pointerEvents="none"
        style={[
          styles.ringTextOverlay,
          {
            width: centerHoleSize,
            height: centerHoleSize,
            borderRadius: centerHoleSize / 2,
            top: cy - centerHoleSize / 2,
            left: cx - centerHoleSize / 2,
          },
        ]}
      >
        {selectedInfo ? (
          <>
            <Text
              style={[
                styles.heroPercentText,
                { color: selectedInfo.color, fontSize: 24 },
              ]}
              numberOfLines={1}
            >
              {selectedInfo.count}
            </Text>
            <Text
              style={[
                styles.heroPercentLabel,
                { color: selectedInfo.color, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {selectedInfo.label}
            </Text>
            <Text style={styles.donutSubText}>Classes</Text>
          </>
        ) : (
          <>
            <Text style={styles.heroPercentText} numberOfLines={1}>
              {(currentPercent * animatedProgress).toFixed(1)}%
            </Text>
            <Text style={styles.heroPercentLabel}>Attendance</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

// Single Category Attendance Card View
function AttendanceCard({
  category,
  label,
  data,
  onSlidingStart,
  onSlidingComplete,
}) {
  const [target, setTarget] = useState(75);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const totalClasses = Number(data?.['Total Classes'] || 0);
  const presentees = Number(data?.['Presentees'] || 0);
  const extra = Number(data?.['Extra Classes'] || 0);
  const attended = presentees + extra;
  const absentees = Math.max(0, totalClasses - attended);

  const currentPercent = totalClasses > 0 ? (attended / totalClasses) * 100 : 0;

  // Active non-zero segments for side legend
  const allSegments = [
    { key: 'present', label: 'Present', count: presentees, color: colors.success },
    { key: 'absent', label: 'Absent', count: absentees, color: colors.destructive },
    { key: 'extra', label: 'Extra', count: extra, color: colors.primary },
  ];
  const activeSegments = allSegments.filter((s) => s.count > 0);
  const totalCount = activeSegments.reduce((sum, s) => sum + s.count, 0);
  const selectedInfo = activeSegments.find((s) => s.key === selectedSegment);

  const result = computeAttendanceResult({
    category,
    totalClasses,
    attended,
    target: String(target),
  });

  return (
    <View style={styles.card}>
      {/* Category Header with Semantic Status Pill (Clean: no 156/200 classes text) */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardHeaderTitleGroup}>
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

      {/* Centered Donut Chart with Interactive Leader Line Indicator */}
      <View style={styles.donutSection}>
        <MultiSegmentDonut
          presentees={presentees}
          absentees={absentees}
          extra={extra}
          currentPercent={currentPercent}
          selectedSegment={selectedSegment}
          onSelectSegment={setSelectedSegment}
        />

        {/* Bottom Reference Legend: clean, compact horizontal row */}
        <View style={styles.legendContainer}>
          {activeSegments.map((seg) => {
            const isSelected = selectedSegment === seg.key;
            return (
              <TouchableOpacity
                key={seg.key}
                style={[
                  styles.legendRow,
                  isSelected && styles.legendRowSelected,
                ]}
                onPress={() =>
                  setSelectedSegment(selectedSegment === seg.key ? null : seg.key)
                }
                activeOpacity={0.7}
              >
                <View style={[styles.legendSwatch, { backgroundColor: seg.color }]} />
                <Text
                  style={[
                    styles.legendLabel,
                    isSelected && { color: seg.color, fontWeight: '700' },
                  ]}
                >
                  {seg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Card Section Separator */}
      <View style={styles.separator} />

      {/* Target Attendance & Platform-Native Slider Section */}
      <View style={styles.calculatorSection}>
        {/* Header row: Target on left, Projection badge on right */}
        <View style={styles.calcHeaderRow}>
          <View style={styles.targetLabelGroup}>
            <View style={styles.targetTitleRow}>
              <TargetIcon size={16} color={colors.secondaryText} />
              <Text style={styles.targetLabel}>Target</Text>
            </View>
            <Text style={styles.targetPercentText}>{target}%</Text>
          </View>

          {/* Dynamic Projection Badge */}
          <View style={styles.projectionWrapper}>
            {target <= 0 ? (
              <View style={styles.neutralPill}>
                <Text style={styles.neutralPillText}>Slide to set target</Text>
              </View>
            ) : result?.mode === 'bunk' ? (
              <View style={styles.bunkPill}>
                <CheckCircleIcon size={16} color={colors.successText} />
                <Text style={styles.bunkPillText}>
                  Bunk: {result.count} {result.count === 1 ? 'class' : 'classes'}
                </Text>
              </View>
            ) : result?.mode === 'attend' ? (
              <View style={styles.attendPill}>
                <TrendingUpIcon size={16} color={colors.primary} />
                <Text style={styles.attendPillText}>
                  Attend: {result.count} {result.count === 1 ? 'class' : 'classes'}
                </Text>
              </View>
            ) : (
              <View style={styles.unreachablePill}>
                <AlertCircleIcon size={16} color={colors.destructiveText} />
                <Text style={styles.unreachablePillText}>
                  Target not attainable
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Platform Native Slider */}
        <View
          style={styles.sliderWrapper}
          onTouchStart={() => onSlidingStart?.()}
          onTouchEnd={() => onSlidingComplete?.()}
          onTouchCancel={() => onSlidingComplete?.()}
        >
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={target}
            onValueChange={(val) => setTarget(Math.round(val))}
            onSlidingStart={() => onSlidingStart?.()}
            onSlidingComplete={() => onSlidingComplete?.()}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={Platform.OS === 'android' ? '#E0E0E0' : '#E5E5EA'}
            thumbTintColor={Platform.OS === 'android' ? colors.primary : undefined}
            thumbSize={Platform.OS === 'android' ? 28 : undefined}
          />
          <View style={styles.sliderScaleRow}>
            <Text style={styles.sliderScaleLabel}>0%</Text>
            <Text style={styles.sliderScaleLabel}>50%</Text>
            <Text
              style={[
                styles.sliderScaleLabel,
                target === 75 && styles.sliderScaleActive,
              ]}
            >
              75%
            </Text>
            <Text style={styles.sliderScaleLabel}>100%</Text>
          </View>
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
        </View>
        <View style={styles.skeletonPill} />
      </View>

      <View style={styles.skeletonDonutSection}>
        <View style={styles.skeletonRing}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
        <View style={styles.skeletonLegendContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonLegendRow}>
              <View style={styles.skeletonSwatch} />
              <View style={styles.skeletonLegendLine1} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.calculatorSection}>
        <View style={styles.skeletonCalcRow}>
          <View style={styles.skeletonCalcLabel} />
          <View style={styles.skeletonBadge} />
        </View>
        <View style={styles.skeletonSliderTrack} />
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
  const [isSliding, setIsSliding] = useState(false);

  // Dynamically extract all available categories from parsed attendance data
  const categories = [];

  if (Array.isArray(attendanceData?.categories) && attendanceData.categories.length > 0) {
    attendanceData.categories.forEach((cat) => {
      if (cat?.name && cat?.data) {
        categories.push({
          key: cat.name,
          label: `${cat.name} Attendance`,
          data: cat.data,
        });
      }
    });
  } else if (attendanceData?.categories && typeof attendanceData.categories === 'object') {
    Object.entries(attendanceData.categories).forEach(([name, data]) => {
      if (data && typeof data === 'object') {
        categories.push({
          key: name,
          label: `${name} Attendance`,
          data: data,
        });
      }
    });
  } else {
    // Backwards-compatibility fallback
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
      {/* Section Header with Title and Subtitle */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleGroup}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Attendance Calculator
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>Current semester</Text>
      </View>

      {/* Platform-Adaptive Switcher: iOS 26 Liquid Glass on iOS, Platform-Native Tab Bar on Android */}
      {categories.length > 1 && (
        <View style={styles.switcherRow}>
          <SegmentedSwitcher
            segments={categories.map((c) => ({ key: c.key, label: c.key }))}
            selectedIndex={activeIndex}
            onChange={(idx) => {
              scrollRef.current?.scrollTo({
                x: idx * screenWidth,
                animated: true,
              });
              setActiveIndex(idx);
            }}
          />
        </View>
      )}

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
            scrollEnabled={!isSliding}
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
                      onSlidingStart={() => setIsSliding(true)}
                      onSlidingComplete={() => setIsSliding(false)}
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

  // Native Platform Switcher Styles
  switcherRow: {
    marginBottom: spacing.md,
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

  cardHeaderTitleGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },

  // Donut Section (Centered composition with leader line indicator)
  donutSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  donutRingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  heroPercentText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  heroPercentLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '600',
    marginTop: -1,
  },
  donutSubText: {
    fontSize: 10,
    color: colors.tertiaryText,
    fontWeight: '500',
    marginTop: 1,
  },

  // Reference Legend (Clean horizontal row below donut)
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
  },
  legendRowSelected: {
    backgroundColor: '#F2F2F7',
  },
  legendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  // Calculator Section (Spacious, prominent and comfortable)
  calculatorSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  calcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  targetLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  targetPercentText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  projectionWrapper: {
    alignItems: 'flex-end',
  },

  // Dynamic Projection Pills (Substantial, comfortable touch padding & clear typography)
  bunkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderColor: '#C3E6CB',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    gap: 6,
  },
  bunkPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
  },
  attendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    gap: 6,
  },
  attendPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  unreachablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.destructiveBg,
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    gap: 6,
  },
  unreachablePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.destructiveText,
  },
  neutralPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.neutralButton,
  },
  neutralPillText: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '600',
  },

  // Slider & Scale (Platform-tailored width: wider on Android, inset on iOS)
  sliderWrapper: {
    marginTop: spacing.xs,
    marginHorizontal: Platform.OS === 'android' ? 6 : spacing.base,
  },
  slider: {
    width: '100%',
    height: Platform.OS === 'android' ? 44 : 40,
  },
  sliderScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.OS === 'android' ? 2 : 4,
    marginTop: 0,
  },
  sliderScaleLabel: {
    fontSize: 11,
    color: colors.tertiaryText,
    fontWeight: '600',
  },
  sliderScaleActive: {
    color: colors.primary,
    fontWeight: '800',
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
  skeletonDonutSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    gap: 12,
  },
  skeletonRing: {
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 18,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  skeletonLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonSwatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    marginRight: 6,
  },
  skeletonLegendLine1: {
    width: 46,
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  skeletonCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  skeletonCalcLabel: {
    width: 130,
    height: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  skeletonBadge: {
    width: 100,
    height: 26,
    backgroundColor: '#E5E5EA',
    borderRadius: radius.full,
  },
  skeletonSliderTrack: {
    marginHorizontal: Platform.OS === 'android' ? 6 : spacing.base,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginTop: 14,
    marginBottom: 8,
  },
});
