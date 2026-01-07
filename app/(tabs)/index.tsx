import { View, Text, FlatList, RefreshControl, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useRecords } from "@/hooks/use-records";
import type { Record } from "@/lib/data/types";
import { useColors } from "@/hooks/use-colors";

/**
 * Home Screen - Records List
 * 
 * Displays all records with sync status indicators.
 * Features:
 * - Pull-to-refresh to trigger sync
 * - Floating action button to create new record
 * - Visual badges for sync status
 */
export default function HomeScreen() {
  const { records, loading, error, syncStats, refresh, syncRecords } = useRecords();
  const colors = useColors();

  const handleRefresh = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await syncRecords();
    await refresh();
  };

  const handleCreateRecord = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/create");
  };

  const handleRecordPress = (record: Record) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/record/${record.id}`);
  };

  const renderSyncBadge = (status: Record["syncStatus"]) => {
    const badges = {
      SYNCED: { text: "Synced", color: "bg-success" },
      PENDING: { text: "Pending", color: "bg-warning" },
      FAILED: { text: "Failed", color: "bg-error" },
    };

    const badge = badges[status];
    return (
      <View className={`${badge.color} px-2 py-1 rounded-full`}>
        <Text className="text-xs font-semibold text-white">{badge.text}</Text>
      </View>
    );
  };

  const renderRecord = ({ item }: { item: Record }) => (
    <TouchableOpacity
      onPress={() => handleRecordPress(item)}
      className="bg-surface rounded-xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-foreground flex-1 mr-2" numberOfLines={1}>
          {item.title}
        </Text>
        {renderSyncBadge(item.syncStatus)}
      </View>
      <Text className="text-sm text-muted mb-2" numberOfLines={2}>
        {item.body}
      </Text>
      <Text className="text-xs text-muted">
        {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-2xl font-bold text-foreground mb-2">No Records Yet</Text>
      <Text className="text-sm text-muted text-center px-6">
        Tap the + button below to create your first record
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3 border-b border-border">
          <Text className="text-3xl font-bold text-foreground mb-2">Records</Text>
          <View className="flex-row items-center gap-4">
            <Text className="text-sm text-muted">
              Total: {syncStats.total}
            </Text>
            <Text className="text-sm text-success">
              Synced: {syncStats.synced}
            </Text>
            {syncStats.pending > 0 && (
              <Text className="text-sm text-warning">
                Pending: {syncStats.pending}
              </Text>
            )}
            {syncStats.failed > 0 && (
              <Text className="text-sm text-error">
                Failed: {syncStats.failed}
              </Text>
            )}
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mx-6 mt-3 p-3 bg-error/10 rounded-lg border border-error">
            <Text className="text-sm text-error">{error}</Text>
          </View>
        )}

        {/* Records List */}
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          ListEmptyComponent={!loading ? renderEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />

        {/* Floating Action Button */}
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={handleCreateRecord}
            className="bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg active:opacity-80"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-4xl text-white font-light" style={{ marginTop: -2 }}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
