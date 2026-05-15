import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../config/supabase";

export default function GardenScreen() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchPlants = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPlants(data);
    }
    setLoading(false);
  };

  // Refetch when screen comes into focus (e.g. after saving a new plant)
  useFocusEffect(
    useCallback(() => {
      fetchPlants();
    }, [])
  );

  const renderPlant = ({ item }) => (
    <TouchableOpacity
      style={styles.plantCard}
      onPress={() => navigation.navigate("PlantDetail", { plant: item })}
    >
      <Text style={styles.plantName}>{item.name}</Text>
      <Text style={styles.plantDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Your garden is empty</Text>
      <Text style={styles.emptySubtext}>
        Take a photo of a plant to get started
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Garden</Text>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPlant}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={plants.length === 0 && styles.emptyList}
        refreshing={loading}
        onRefresh={fetchPlants}
      />
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
    marginBottom: 20,
  },
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d4e5d4",
  },
  plantName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d6a4f",
  },
  plantDate: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
  },
  emptyList: {
    flex: 1,
  },
});
