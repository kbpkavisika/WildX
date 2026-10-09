import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { AppText } from "@/components/ui/text";
import { useLogin } from "@/hooks/use-login";
import { EMPTY_SIGN_IN, signInErrorMessage, signInSchema, type SignInValues } from "@/lib/auth/sign-in-form";
import { colors, radii, sizes, space } from "@/lib/theme";

const CHECKBOX_SIZE = 18;
const CHECK_ICON_SIZE = 14;
const CHECK_STROKE = 3;
const SUBTITLE_SIZE = 15;

export function SignInForm() {
  const signIn = useLogin();
  const [showReset, setShowReset] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: EMPTY_SIGN_IN,
  });

  return (
    <View style={styles.form}>
      <Logo />
      <View style={styles.heading}>
        <AppText variant="pageTitle" accessibilityRole="header">Sign in</AppText>
        <AppText variant="nav" color={colors.inkBody} style={styles.subtitle}>Welcome back. Sign in to the park console.</AppText>
      </View>
      <View style={styles.divider} />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Field label="Work email" error={errors.email?.message}>
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Field
            label={
              <View style={styles.passwordLabel}>
                <AppText variant="fieldLabel" color={colors.inkBody}>Password</AppText>
                <Pressable accessibilityRole="link" hitSlop={space[3]} onPress={() => setShowReset(true)}>
                  <AppText variant="fieldLabel" color={colors.primary}>Forgot password?</AppText>
                </Pressable>
              </View>
            }
            error={errors.password?.message}
            hint={showReset && <AppText variant="caption" color={colors.inkMuted}>Ask your park admin to reset it.</AppText>}
          >
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.password}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="remember"
        render={({ field }) => (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: field.value }}
            onPress={() => field.onChange(!field.value)}
            style={styles.remember}
          >
            <View style={[styles.checkbox, field.value && styles.checkboxChecked]}>
              {field.value && <Check size={CHECK_ICON_SIZE} color={colors.onPrimary} strokeWidth={CHECK_STROKE} />}
            </View>
            <AppText color={colors.inkBody}>Keep me signed in on this device</AppText>
          </Pressable>
        )}
      />
      {signIn.isError && <AppText variant="caption" color={colors.negative} accessibilityRole="alert">{signInErrorMessage(signIn.error)}</AppText>}
      <Button label={signIn.isPending ? "Signing in…" : "Sign in"} disabled={signIn.isPending} onPress={handleSubmit((values) => signIn.mutate(values))} />
      <AppText color={colors.inkMuted} style={styles.centered}>Accounts are created by your park admin.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space[5] },
  heading: { gap: 6 },
  subtitle: { fontSize: SUBTITLE_SIZE },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  passwordLabel: { flexDirection: "row", justifyContent: "space-between" },
  remember: { minHeight: sizes.tap, flexDirection: "row", alignItems: "center", gap: space[2] },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: radii.xs / 2,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  centered: { textAlign: "center" },
});
