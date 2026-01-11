import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db, storage } from '../firebaseConfig';

export default function AddProductionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Check if we are editing
  const [form, setForm] = useState({ 
    title: '', 
    year: '', 
    director: '', 
    type: 'Stage Play', 
    description: '',
    cast: '' // NEW: Cast names field
  });
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load data if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchProduction = async () => {
        const docRef = doc(db, "productions", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            title: data.title || '',
            year: data.year || '',
            director: data.director || '',
            type: data.type || 'Stage Play',
            description: data.description || '',
            cast: data.cast || ''
          });
          setImage(data.image);
        }
        setLoading(false);
      };
      fetchProduction();
    }
  }, [id]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Allow access to photos to upload a poster.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !image) {
      Alert.alert("Missing Info", "Title and poster image are required.");
      return;
    }

    setUploading(true);
    try {
      let downloadURL = image;

      // Only upload if it's a new local image
      if (image && image.startsWith('file')) {
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = `posters/${Date.now()}_${form.title.replace(/\s/g, '_')}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        downloadURL = await getDownloadURL(storageRef);
      }

      if (id) {
        // UPDATE EXISTING
        await updateDoc(doc(db, "productions", id), {
          ...form,
          image: downloadURL,
          updatedAt: serverTimestamp()
        });
        Alert.alert("Updated", "Production details updated successfully.");
      } else {
        // ADD NEW
        await addDoc(collection(db, "productions"), {
          ...form,
          image: downloadURL,
          createdAt: serverTimestamp(),
          isFeatured: false
        });
        Alert.alert("Success", "Production added to website!");
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save data.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ffd700" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{id ? "Edit Production" : "New Production"}</Text>

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.plus}>+</Text>
            <Text style={styles.addText}>Add Poster</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.form}>
        <TextInput 
          style={styles.input} 
          placeholder="Play Title" 
          placeholderTextColor="#666"
          value={form.title}
          onChangeText={(t) => setForm({...form, title: t})}
        />
        <View style={styles.row}>
          <TextInput 
            style={[styles.input, {flex: 1}]} 
            placeholder="Year" 
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={form.year}
            onChangeText={(t) => setForm({...form, year: t})}
          />
          <TextInput 
            style={[styles.input, {flex: 1}]} 
            placeholder="Type (e.g. Stage)" 
            placeholderTextColor="#666"
            value={form.type}
            onChangeText={(t) => setForm({...form, type: t})}
          />
        </View>
        <TextInput 
          style={styles.input} 
          placeholder="Director Name" 
          placeholderTextColor="#666"
          value={form.director}
          onChangeText={(t) => setForm({...form, director: t})}
        />
        
        {/* NEW: CAST NAMES FIELD */}
        <TextInput 
          style={[styles.input, {height: 80}]} 
          placeholder="Cast Names (e.g. Rohan as Romeo, Priya as Juliet...)" 
          placeholderTextColor="#666"
          multiline
          value={form.cast}
          onChangeText={(t) => setForm({...form, cast: t})}
        />

        <TextInput 
          style={[styles.input, {height: 100}]} 
          placeholder="Short Description..." 
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          value={form.description}
          onChangeText={(t) => setForm({...form, description: t})}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={uploading}>
          {uploading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>{id ? "Save Changes" : "Publish Show"}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 20 },
  imagePicker: { alignSelf: 'center', marginBottom: 30 },
  preview: { width: 150, height: 225, borderRadius: 10 },
  placeholder: { width: 150, height: 225, backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 2, borderColor: '#333', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  plus: { fontSize: 40, color: '#666' },
  addText: { color: '#666' },
  form: { gap: 15 },
  row: { flexDirection: 'row', gap: 15 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 15, color: 'white' },
  submitBtn: { backgroundColor: '#ffd700', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});