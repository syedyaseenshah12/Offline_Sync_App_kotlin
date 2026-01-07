import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useRecords } from "@/hooks/use-records";
import { useColors } from "@/hooks/use-colors";

/**
 * Create Record Screen
 * 
 * Form to create a new text record.
 * Saves immediately to local database with PENDING sync status.
 */
export default function CreateRecordScreen() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const { createRecord } = useRecords();
  const colors = useColors();

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Validation Error", "Title and body are required");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSaving(true);
    const success = await createRecord(title, body);
    setSaving(false);

    if (success) {
      router.back();
    } else {
      Alert.alert("Error", "Failed to create record. Please try again.");
    }
  };

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">Create Record</Text>
        </View>

        {/* Form */}
        <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled">
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title (max 200 characters)"
              placeholderTextColor={colors.muted}
              maxLength={200}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              style={{ color: colors.foreground }}
            />
            <Text className="text-xs text-muted mt-1">{title.length}/200</Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Body</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Enter body text (max 5000 characters)"
              placeholderTextColor={colors.muted}
              maxLength={5000}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              style={{ minHeight: 200, color: colors.foreground }}
            />
            <Text className="text-xs text-muted mt-1">{body.length}/5000</Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="px-6 pb-6 pt-4 border-t border-border flex-row gap-3">
          <TouchableOpacity
            onPress={handleCancel}
            disabled={saving}
            className="flex-1 bg-surface border border-border rounded-xl py-4 items-center active:opacity-70"
          >
            <Text className="text-base font-semibold text-foreground">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !title.trim() || !body.trim()}
            className={`flex-1 rounded-xl py-4 items-center ${
              saving || !title.trim() || !body.trim()
                ? "bg-muted opacity-50"
                : "bg-primary active:opacity-80"
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
