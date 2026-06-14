import { ScrollView, RefreshControl, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface ScreenProps extends ScrollViewProps {
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
}

export function Screen({
  children,
  refreshing,
  onRefresh,
  padded = true,
  contentContainerStyle,
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        {...props}
        contentContainerStyle={[padded && styles.content, contentContainerStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
