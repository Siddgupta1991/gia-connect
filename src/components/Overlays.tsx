import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Let the content scroll. Turn off when the child is a FlatList. */
  scroll?: boolean;
  tall?: boolean;
}

export function BottomSheet({ visible, onClose, title, children, footer, scroll = true, tall }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
          <View style={styles.backdrop} />
        </Pressable>
        <View style={[styles.sheet, tall && { height: '85%' }, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <AppText variant="sectionTitle" style={styles.sheetTitle} accessibilityRole="header">
            {title}
          </AppText>
          {scroll ? (
            <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>{children}</View>
          )}
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  loading,
  onConfirm,
  onCancel,
  children,
}: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.dialogRoot}>
        <View style={styles.backdrop} />
        <View style={styles.dialog} accessibilityViewIsModal>
          <AppText variant="sectionTitle" accessibilityRole="header">
            {title}
          </AppText>
          <AppText color={colors.textSecondary}>{message}</AppText>
          {children}
          <View style={styles.dialogButtons}>
            <Button title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} loading={loading} />
            <Button title={cancelLabel} variant="text" onPress={onCancel} disabled={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 8,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 8 },
  sheetTitle: { paddingHorizontal: layout.screenPadding, paddingBottom: 8 },
  sheetBody: { paddingHorizontal: layout.screenPadding, paddingBottom: 8, gap: 12 },
  sheetFooter: { paddingHorizontal: layout.screenPadding, paddingTop: 12 },
  dialogRoot: { flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12 },
  dialogButtons: { gap: 4, marginTop: 8 },
});
