import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../firebaseConfig';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState([]);
  const [role, setRole] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Get User Role & Listen for Photos
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setRole(docSnap.data().role);
      }
    };
    fetchRole();

    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Upload Logic
  const handlePickAndUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Need access to photos to upload.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "gallery"), {
        url,
        uploadedBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      Alert.alert("Success", "Photo added to gallery!");
    } catch (error) {
      Alert.alert("Error", "Failed to upload.");
    } finally {
      setUploading(false);
    }
  };

  // 3. Delete Logic (Admin Only)
  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure? This will remove it from the website too.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "gallery", id));
            } catch (error) {
              Alert.alert("Error", "Could not delete.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Club Gallery</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handlePickAndUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color="black" /> : <Text style={styles.addBtnText}>+ Add Photo</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#ffd700" style={{marginTop: 20}} />
      ) : photos.length === 0 ? (
        <Text style={styles.empty}>No photos yet. Be the first!</Text>
      ) : (
        <FlatList 
          data={photos}
          numColumns={2}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.url }} style={styles.image} />
              {role === 'admin' && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#ffd700', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  addBtnText: { color: 'black', fontWeight: 'bold', fontSize: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  card: { flex: 1, aspectRatio: 1, margin: 5, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%' },
  deleteBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', padding: 5, borderRadius: 20 },
  deleteText: { fontSize: 12 },
});