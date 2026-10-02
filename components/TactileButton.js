import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius } from '../theme.js';

/**
 * TactileButton
 *
 * Matches the Tactile iOS Blue Button CSS reference using RN's native
 * boxShadow style prop (RN 0.76+, requires New Architecture / Fabric).
 * - Base color: #007AFF
 * - Pill shape: borderRadius 9999
 * - Top inset highlight + bottom inset bevel, taken directly from the
 *   reference's `box-shadow: inset ...` values
 * - Shadow flattens on press to mimic the CSS :active state
 * - translateY(2px) on press for the physical "push down" feel
 */
export default function TactileButton({
  title,
  onPress,
  disabled = false,
  color = colors.primary, // #007AFF
  style,
  textStyle,
  icon = null,
  paddingVertical = 11,
  paddingHorizontal = 16,
  borderRadius = radius.base, // 12px (reduced from pill)
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    if (disabled) return;
    setPressed(true);
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 160,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    setPressed(false);
    Animated.spring(pressAnim, {
      toValue: 0,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  // Rest state: matches the reference's default inset box-shadow
  const restShadow = [
    { offsetX: 0, offsetY: 1.5, blurRadius: 1, color: 'rgba(255,255,255,0.45)', inset: true },
    { offsetX: 0, offsetY: -2.5, blurRadius: 3, color: 'rgba(0,32,96,0.45)', inset: true },
  ];

  // Pressed state: matches the reference's :active inset box-shadow (flattened)
  const pressedShadow = [
    { offsetX: 0, offsetY: 1, blurRadius: 1, color: 'rgba(255,255,255,0.25)', inset: true },
    { offsetX: 0, offsetY: -1, blurRadius: 1.5, color: 'rgba(0,32,96,0.65)', inset: true },
  ];

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[styles.pressable, { borderRadius }]}
      >
        <Animated.View
          style={[
            styles.buttonBody,
            {
              backgroundColor: color,
              paddingVertical,
              paddingHorizontal,
              borderRadius,
              transform: [{ translateY }],
              boxShadow: disabled ? [] : pressed ? pressedShadow : restShadow,
            },
            disabled && styles.buttonDisabled,
          ]}
        >
          <View style={styles.contentRow}>
            {icon}
            <Text
              style={[
                styles.buttonText,
                disabled && styles.buttonTextDisabled,
                textStyle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.base,
  },
  pressable: {
    width: '100%',
    borderRadius: radius.base,
  },
  buttonBody: {
    width: '100%',
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.38,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#FFFFFF',
  },
});