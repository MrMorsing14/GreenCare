import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";

export default function HomeScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setSidebarVisible(false);
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Welcome to GreenCare</Text>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Ionicons name="settings-outline" size={26} color="#2d6a4f" />
        </TouchableOpacity>
      </View>

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

      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setSidebarVisible(false)}
        >
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#d32f2f" />
              <Text style={styles.menuItemTextDanger}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d6a4f",
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sidebar: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 50,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  menuItemTextDanger: {
    fontSize: 16,
    color: "#d32f2f",
    marginLeft: 12,
    fontWeight: "500",
  },
});