import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { supabase } from "../config/supabase";
import { File } from "expo-file-system";

export default function PlantDetailScreen({ route, navigation }) {
  const [saving, setSaving] = useState(false);

  const plant = route?.params?.plant || {
    name: "Unknown Plant",
    confidence: 0,
    care: { water: "N/A", sunlight: "N/A", soil: "N/A" },
  };

  const isAlreadySaved = !!plant.id;
  const [nickname, setNickname] = useState("");
  const [signedImageUrl, setSignedImageUrl] = useState(isAlreadySaved ? null : plant.image_url || null);

  // For saved plants, generate a signed URL from the stored path
  useEffect(() => {
    if (isAlreadySaved && plant.image_url) {
      supabase.storage
        .from("plant-photos")
        .createSignedUrl(plant.image_url, 60 * 60)
        .then(({ data }) => {
          if (data) setSignedImageUrl(data.signedUrl);
        });
    }
  }, []);
    
  const uploadPhoto = async (userId, localUri) => {
    try {
      const file = new File(localUri);
      const arrayBuffer = await file.arrayBuffer();

      const fileName = `${userId}/${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("plant-photos")
        .upload(fileName, arrayBuffer, {
          contentType: "image/jpeg",
        });

      if (error) throw error;

      const { data: urlData } = await supabase.storage
        .from("plant-photos")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      return fileName
    } catch (err) {
      console.log("Photo upload failed:", err.message);
      return null;
    }
  };

  const handleSaveToGarden = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let imageUrl = null;
    if (plant.image_url) {
      imageUrl = await uploadPhoto(user.id, plant.image_url);
    }

    const { error } = await supabase.from("plants").insert({
      user_id: user.id,
      name: plant.name,
      nickname: nickname.trim() || null,
      confidence: plant.confidence,
      care_water: plant.care.water,
      care_sunlight: plant.care.sunlight,
      care_soil: plant.care.soil,
      image_url: imageUrl,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Failed to save plant: " + error.message);
    } else {
      const displayName = nickname.trim() || plant.name;
      Alert.alert("Saved!", `${displayName} has been added to your garden.`, [
        { text: "OK", onPress: () => navigation.popToTop() },
      ]);
    }
  };

  const care = plant.care || {
    water: plant.care_water || "N/A",
    sunlight: plant.care_sunlight || "N/A",
    soil: plant.care_soil || "N/A",
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {signedImageUrl && (
      <Image source={{ uri: signedImageUrl }} style={styles.plantImage} />
      )}

      <View style={styles.header}>
        <Text style={styles.plantName}>{plant.name}</Text>
        {plant.confidence > 0 && (
          <Text style={styles.confidence}>
            {Math.round(plant.confidence * 100)}% confidence
          </Text>
        )}
      </View>

      <View style={styles.careSection}>
        <Text style={styles.sectionTitle}>Care Instructions</Text>

        <View style={styles.careItem}>
          <Text style={styles.careLabel}>Water</Text>
          <Text style={styles.careValue}>{care.water}</Text>
        </View>

        <View style={styles.careItem}>
          <Text style={styles.careLabel}>Sunlight</Text>
          <Text style={styles.careValue}>{care.sunlight}</Text>
        </View>

        <View style={styles.careItem}>
          <Text style={styles.careLabel}>Soil</Text>
          <Text style={styles.careValue}>{care.soil}</Text>
        </View>
      </View>

      {!isAlreadySaved && (
        <>
          <TextInput
            style={styles.nicknameInput}
            placeholder="Give your plant a nickname (optional)"
            value={nickname}
            onChangeText={setNickname}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveToGarden}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save to My Garden</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.retakeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.retakeText}>
          {isAlreadySaved ? "Back to Garden" : "Take Another Photo"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7f0",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  plantImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  plantName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2d6a4f",
  },
  confidence: {
    fontSize: 14,
    color: "#6b8f71",
    marginTop: 4,
  },
  careSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#d4e5d4",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d6a4f",
    marginBottom: 16,
  },
  careItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef4ee",
  },
  careLabel: {
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
  },
  careValue: {
    fontSize: 16,
    color: "#2d6a4f",
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  nicknameInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d4e5d4",
  },
  saveButton: {
    backgroundColor: "#2d6a4f",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  retakeButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  retakeText: {
    color: "#2d6a4f",
    fontSize: 16,
  },
});