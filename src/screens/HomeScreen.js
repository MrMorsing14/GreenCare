import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to GreenCare</Text>
      <Text style={styles.description}>
        Take a photo of any plant to identify it and learn how to care for it.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How it works</Text>
        <Text style={styles.cardStep}>1. Tap the camera button below</Text>
        <Text style={styles.cardStep}>2. Take a photo of your plant</Text>
        <Text style={styles.cardStep}>3. Get care instructions instantly</Text>
        <Text style={styles.cardStep}>4. Save it to your garden</Text>
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d6a4f",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#6b8f71",
    lineHeight: 24,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#d4e5d4",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d6a4f",
    marginBottom: 16,
  },
  cardStep: {
    fontSize: 15,
    color: "#555",
    marginBottom: 10,
    lineHeight: 22,
  },
});
