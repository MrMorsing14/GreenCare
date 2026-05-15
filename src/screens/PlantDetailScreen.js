import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

export default function PlantDetailScreen({ route, navigation }) {
  // Plant data will come from route.params after camera + API flow
  const plant = route?.params?.plant || {
    name: "Unknown Plant",
    confidence: 0,
    care: {
      water: "N/A",
      sunlight: "N/A",
      soil: "N/A",
    },
  };

  const handleSaveToGarden = () => {
    // TODO: Save to Firestore
    Alert.alert("TODO", "Save to Firestore not implemented yet");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.plantName}>{plant.name}</Text>
        <Text style={styles.confidence}>
          {Math.round(plant.confidence * 100)}% confidence
        </Text>
      </View>

      <View style={styles.careSection}>
        <Text style={styles.sectionTitle}>Care Instructions</Text>

        <View style={styles.careItem}>
          <Text style={styles.careLabel}>Water</Text>
          <Text style={styles.careValue}>{plant.care.water}</Text>
        </View>

        <View style={styles.careItem}>
          <Text style={styles.careLabel}>Sunlight</Text>
          <Text style={styles.careValue}>{plant.care.sunlight}</Text>
        </View>

        <View style={styles.careItem}>
          <Text style={styles.careLabel}>Soil</Text>
          <Text style={styles.careValue}>{plant.care.soil}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveToGarden}>
        <Text style={styles.saveButtonText}>Save to My Garden</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.retakeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.retakeText}>Take Another Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7f0",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
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
    marginBottom: 24,
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
