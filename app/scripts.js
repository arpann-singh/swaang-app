import * as DocumentPicker from 'expo-document-picker';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../firebaseConfig';

export default function ScriptsScreen() {
  const [scripts, setScripts] = useState([]);
  const [role, setRole] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get User Role
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setRole(docSnap.data().role);
      }
    };
    fetchRole();

    // 2. Listen for Scripts
    const q = query(collection(db, "scripts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setScripts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const response = await fetch(file.uri);
      const blob = await response.blob();
      const filename = `scripts/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "scripts"), {
        name: file.name,
        url: downloadURL,
        uploadedBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      Alert.alert("Success", "Script uploaded!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to upload script.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, url) => {
    Alert.alert(
      "Delete Script",
      "Are you sure you want to delete this script?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Delete from Firestore
              await deleteDoc(doc(db, "scripts", id));
              
              // 2. Delete from Storage (try/catch in case file is already gone)
              try {
                const fileRef = ref(storage, url);
                await deleteObject(fileRef);
              } catch (err) {
                console.log("Storage file delete error (ignoring):", err);
              }
              
              Alert.alert("Deleted", "Script removed successfully.");
            } catch (error) {
              Alert.alert("Error", "Could not delete script.");
            }
          }
        }
      ]
    );
  };

  const openScript = (url) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Script Library</Text>
      
      {role === 'admin' && (
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>+ Upload New PDF</Text>}
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color="#ffd700" style={{marginTop: 20}} />
      ) : scripts.length === 0 ? (
        <Text style={styles.empty}>No scripts available yet.</Text>
      ) : (
        <FlatList 
          data={scripts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <TouchableOpacity style={styles.card} onPress={() => openScript(item.url)}>
                <Text style={styles.icon}>📜</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.scriptName}>{item.name}</Text>
                  <Text style={styles.subtext}>Tap to read</Text>
                </View>
              </TouchableOpacity>
              
              {/* DELETE BUTTON (Admin Only) */}
              {role === 'admin' && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.url)}>
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
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 20 },
  uploadBtn: { backgroundColor: '#ffd700', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  btnText: { color: 'black', fontWeight: 'bold' },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  cardContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  icon: { fontSize: 24, marginRight: 15 },
  scriptName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  subtext: { color: '#666', fontSize: 12 },
  deleteBtn: { marginLeft: 10, padding: 10, backgroundColor: '#2a0000', borderRadius: 8, borderWidth: 1, borderColor: '#500' },
  deleteText: { fontSize: 16 },
});