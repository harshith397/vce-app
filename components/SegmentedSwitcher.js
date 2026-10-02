import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, shadows, spacing } from '../theme.js';

// Geometric Constants for Pixel-Perfect Concentric Pill Alignment
const PADDING = 3;
const HEIGHT = 40;
const INNER_HEIGHT = HEIGHT - (PADDING * 2) - 2; // 32px
const OUTER_RADIUS = HEIGHT / 2; // 20px
const INNER_RADIUS = INNER_HEIGHT / 2; // 16px (Concentric: 20 - 4 = 16)

/**
 * SegmentedSwitcher
 * 
 * Delivers Apple's iOS 26 Liquid Glass pill-shaped design language:
 * - Concentric outer pill container and inner Liquid Glass active pill capsule.
 * - Exact uniform 3px margins on Top, Bottom, Left, and Right (never lopsided).
 * - Smooth physics-based spring animation across segment selections.
 * - Dynamic segment support with horizontal scroll protection for 4+ items.
 */
export default function SegmentedSwitcher({
  segments = [],
  selectedIndex = 0,
  onChange,
  containerStyle,
}) {
  const isScrollable = segments.length > 3;

  // Normalized segment items
  const items = segments.map((s, idx) => {
    if (typeof s === 'string') return { key: s, label: s };
    return {
      key: s.key || s.name || s.label || String(idx),
      label: s.label || s.name || s.key || String(idx),
    };
  });

  // Track layout coordinates (x and width) for each segment
  const [layouts, setLayouts] = useState({});
  const isMeasured = layouts[selectedIndex] !== undefined;

  const animLeft = useRef(new Animated.Value(0)).current;
  const animWidth = useRef(new Animated.Value(0)).current;
  const isInitialized = useRef(false);
  const scrollRef = useRef(null);

  const handleLayout = (idx, event) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[idx] && prev[idx].x === x && prev[idx].width === width) {
        return prev;
      }
      return { ...prev, [idx]: { x, width } };
    });
  };

  // Smoothly animate the active selection indicator when selectedIndex changes
  useEffect(() => {
    const current = layouts[selectedIndex];
    if (current) {
      if (!isInitialized.current) {
        animLeft.setValue(current.x);
        animWidth.setValue(current.width);
        isInitialized.current = true;
      } else {
        Animated.parallel([
          Animated.spring(animLeft, {
            toValue: current.x,
            tension: 80,
            friction: 12,
            useNativeDriver: false,
          }),
          Animated.spring(animWidth, {
            toValue: current.width,
            tension: 80,
            friction: 12,
            useNativeDriver: false,
          }),
        ]).start();
      }

      // Auto-scroll when in scrollable mode
      if (isScrollable && scrollRef.current) {
        const targetX = Math.max(0, current.x - 48);
        scrollRef.current.scrollTo({ x: targetX, animated: true });
      }
    }
  }, [selectedIndex, layouts, isScrollable]);

  if (items.length <= 1) {
    return null;
  }

  const content = (
    <View
      style={[
        styles.outerContainer,
        !isScrollable && styles.fullWidth,
      ]}
    >
      {/* 
        Inner Track: 
        Direct parent of BOTH activePill and buttonsRow.
        Guarantees that onLayout x=0 directly matches activePill left=0,
        giving uniform 3px clearance from all four sides of the outer border.
      */}
      <View style={styles.track}>
        {/* Animated Active Selection Pill */}
        {isMeasured && (
          <Animated.View
            style={[
              styles.activePill,
              styles.liquidGlassPill,
              {
                left: animLeft,
                width: animWidth,
              },
            ]}
            pointerEvents="none"
          >
            {/* Specular Liquid Glass Glare Highlight */}
            <View style={styles.liquidGlassGlare} />
          </Animated.View>
        )}

        {/* Buttons Row */}
        <View style={styles.buttonsRow}>
          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <TouchableOpacity
                key={item.key}
                onLayout={(e) => handleLayout(idx, e)}
                onPress={() => onChange && onChange(idx)}
                activeOpacity={0.7}
                style={[
                  styles.segmentButton,
                  !isScrollable && styles.flexSegment,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessible={true}
                accessibilityLabel={item.label}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  if (isScrollable) {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, containerStyle]}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.fixedContainer, containerStyle]}>{content}</View>;
}

const styles = StyleSheet.create({
  fixedContainer: {
    paddingHorizontal: spacing.base,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
  },
  fullWidth: {
    width: '100%',
  },
  flexSegment: {
    flex: 1,
  },

  // Outer Pill Container (Unified Translucent Glass)
  outerContainer: {
    height: HEIGHT,
    borderRadius: OUTER_RADIUS,
    backgroundColor: 'rgba(235, 240, 248, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: PADDING,
    ...shadows.subtle,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },

  // Inner Track: Exactly matches the coordinate space inside the 3px padding
  track: {
    flex: 1,
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
  },

  // Buttons Row: Sits inside track alongside activePill
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    zIndex: 2,
  },

  // Animated Active Pill: Sits inside track with top:0, bottom:0 matching track height exactly
  activePill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: INNER_RADIUS, // Concentric with outer radius
    zIndex: 1,
    overflow: 'hidden',
  },

  // Liquid Glass Capsule
  liquidGlassPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 1)',
    borderBottomColor: 'rgba(180, 205, 235, 0.5)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#002B5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  // Specular Liquid Glass Glare Highlight
  liquidGlassGlare: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: '48%',
    borderRadius: INNER_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  // Segment Buttons
  segmentButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: INNER_RADIUS,
  },

  // Segment Typography
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5A677D',
    letterSpacing: -0.2,
  },
  segmentTextActive: {
    color: '#0A1326',
    fontWeight: '700',
  },
});
