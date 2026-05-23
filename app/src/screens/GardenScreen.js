import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../config/supabase";

export default function GardenScreen() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchPlants = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const plantsWithUrls = await Promise.all(
        data.map(async (plant) => {
          if (plant.image_url) {
            const { data: urlData } = await supabase.storage
              .from("plant-photos")
              .createSignedUrl(plant.image_url, 60 * 60);
            return { ...plant, signed_image_url: urlData?.signedUrl || null };
          }
          return { ...plant, signed_image_url: null };
        })
      );
      setPlants(plantsWithUrls);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlants();
    }, [])
  );

  const handleDelete = (plant) => {
    const displayName = plant.nickname || plant.name;
    Alert.alert("Delete Plant", `Remove ${displayName} from your garden?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("plants")
            .delete()
            .eq("id", plant.id);

          if (error) {
            Alert.alert("Error", "Failed to delete plant");
          } else {
            setPlants((prev) => prev.filter((p) => p.id !== plant.id));
          }
        },
      },
    ]);
  };

  const renderPlant = ({ item }) => (
    <TouchableOpacity
      style={styles.plantCard}
      onPress={() => navigation.navigate("PlantDetail", { plant: item })}
      onLongPress={() => handleDelete(item)}
    >
      {item.signed_image_url ? (
        <Image source={{ uri: item.signed_image_url }} style={styles.plantImage} />
      ) : (
        <View style={styles.plantImagePlaceholder}>
          <Text style={styles.placeholderText}>No photo</Text>
        </View>
      )}
      <View style={styles.plantInfo}>
        {item.nickname && (
          <Text style={styles.plantNickname} numberOfLines={1}>
            {item.nickname}
          </Text>
        )}
        <Text
          style={item.nickname ? styles.plantSpecies : styles.plantName}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </View>
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
        numColumns={2}
        columnWrapperStyle={styles.row}
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
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d6a4f",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "48%",
    borderWidth: 1,
    borderColor: "#d4e5d4",
    overflow: "hidden",
  },
  plantImage: {
    width: "100%",
    height: 140,
  },
  plantImagePlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#e8f0e8",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
    fontSize: 13,
  },
  plantInfo: {
    padding: 10,
  },
  plantNickname: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d6a4f",
  },
  plantSpecies: {
    fontSize: 12,
    color: "#6b8f71",
    marginTop: 2,
  },
  plantName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d6a4f",
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