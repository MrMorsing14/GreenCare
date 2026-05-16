import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

export default function CameraScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Permission not yet determined
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need camera access to identify your plants
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    const result = await cameraRef.current.takePictureAsync({
      quality: 0.7,
      base64: false,
    });

    setPhoto(result.uri);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleIdentify = async () => {
    if (!photo) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: photo,
        type: "image/jpeg",
        name: "plant.jpg",
      });

      const response = await fetch("http://192.168.0.138:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server returned " + response.status);
      }

      const result = await response.json();

      navigation.navigate("PlantDetail", {
        plant: {
          name: result.prediction,
          confidence: result.confidence,
          image_url: photo,
          top_3: result.top_3,
          care: result.care,
        },
      });
    } catch (error) {
      Alert.alert("Identification Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  // Photo taken — show preview with confirm/retake
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Identifying plant...</Text>
          </View>
        ) : (
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.identifyButton} onPress={handleIdentify}>
              <Text style={styles.identifyText}>Identify Plant</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing(facing === "back" ? "front" : "back")}
          >
            <Text style={styles.flipText}>Flip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  flipButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  flipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  galleryButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  galleryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  placeholder: {
    width: 60,
  },
  // Preview screen
  preview: {
    flex: 1,
  },
  previewActions: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  retakeButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retakeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  identifyButton: {
    backgroundColor: "#2d6a4f",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
  },
  identifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Loading overlay
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  // Permission screen
  permissionContainer: {
    flex: 1,
    backgroundColor: "#f0f7f0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  permissionText: {
    fontSize: 18,
    color: "#2d6a4f",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 26,
  },
  permissionButton: {
    backgroundColor: "#2d6a4f",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});