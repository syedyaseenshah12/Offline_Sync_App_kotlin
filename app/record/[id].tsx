import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import * as useCases from "@/lib/domain/use-cases";
import type { Record } from "@/lib/data/types";
import { useColors } from "@/hooks/use-colors";

/**
 * Record Detail Screen
 * 
 * Displays full record details including sync status.
 * Allows retrying failed syncs.
 */
export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const colors = useColors();

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    if (!id) return;

    setLoading(true);
    const result = await useCases.fetchRecordById(id);
    setLoading(false);

    if (result.success) {
      setRecord(result.data);
    } else {
      Alert.alert("Error", "Failed to load record");
      router.back();
    }
  };

  const handleRetrySync = async () => {
    if (!record) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSyncing(true);
    const result = await useCases.retryFailedSyncs();
    setSyncing(false);

    if (result.success) {
      Alert.alert("Success", "Sync retry initiated");
      await loadRecord();
    } else {
      Alert.alert("Error", "Failed to retry sync");
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const renderSyncStatus = () => {
    if (!record) return null;

    const statusConfig = {
      SYNCED: {
        bg: "bg-success/10",
        border: "border-success",
        text: "text-success",
        title: "✓ Synced",
        message: "This record has been successfully synced to the server.",
      },
      PENDING: {
        bg: "bg-warning/10",
        border: "border-warning",
        text: "text-warning",
        title: "⏳ Pending Sync",
        message: "This record will be synced when internet is available.",
      },
      FAILED: {
        bg: "bg-error/10",
        border: "border-error",
        text: "text-error",
        title: "✗ Sync Failed",
        message: record.syncError || "Sync failed. Tap retry to try again.",
      },
    };

    const config = statusConfig[record.syncStatus];

    return (
      <View className={`${config.bg} border ${config.border} rounded-xl p-4 mb-6`}>
        <Text className={`text-base font-bold ${config.text} mb-1`}>
          {config.title}
        </Text>
        <Text className="text-sm text-muted">{config.message}</Text>

        {record.lastSyncAttempt && (
          <Text className="text-xs text-muted mt-2">
            Last attempt: {record.lastSyncAttempt.toLocaleString()}
          </Text>
        )}

        {record.remoteId && (
          <Text className="text-xs text-muted mt-1">
            Remote ID: {record.remoteId}
          </Text>
        )}

        {record.syncStatus === "FAILED" && (
          <TouchableOpacity
            onPress={handleRetrySync}
            disabled={syncing}
            className="mt-3 bg-primary rounded-lg py-2 px-4 self-start active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">
              {syncing ? "Retrying..." : "Retry Sync"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!record) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-foreground mb-2">Record Not Found</Text>
          <TouchableOpacity onPress={handleBack} className="mt-4 bg-primary rounded-lg py-3 px-6">
            <Text className="text-base font-semibold text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3 border-b border-border flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="mr-3 active:opacity-70">
            <Text className="text-2xl text-primary">←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Record Details</Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-6">
          {renderSyncStatus()}

          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-2">TITLE</Text>
            <Text className="text-xl font-bold text-foreground">{record.title}</Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-2">BODY</Text>
            <Text className="text-base text-foreground leading-relaxed">{record.body}</Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-2">CREATED</Text>
            <Text className="text-base text-foreground">
              {record.createdAt.toLocaleDateString()} at {record.createdAt.toLocaleTimeString()}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-2">RECORD ID</Text>
            <Text className="text-xs text-muted font-mono">{record.id}</Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
