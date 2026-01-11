import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../firebaseConfig';

export default function ProfileScreen() {
  // Added instagram and twitter to state
  const [form, setForm] = useState({ name: '', role: '', category: 'Actors', bio: '', instagram: '', twitter: '' });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const user = auth.currentUser;

  // 1. Load existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            name: data.name || '',
            role: data.displayRole || 'Member',
            category: data.category || 'Actors',
            bio: data.bio || '',
            instagram: data.instagram || '', // Load Instagram
            twitter: data.twitter || ''      // Load Twitter
          });
          if (data.photoUrl) setImage(data.photoUrl);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Pick Image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square for profile pics
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 3. Save Changes
  const handleSave = async () => {
    setSaving(true);
    try {
      let photoUrl = image;

      // If image is new (local URI), upload it
      if (image && image.startsWith('file')) {
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = `profiles/${user.uid}_${Date.now()}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        photoUrl = await getDownloadURL(storageRef);
      }

      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        name: form.name,
        displayRole: form.role,
        category: form.category,
        bio: form.bio,
        instagram: form.instagram, // Save Instagram
        twitter: form.twitter,     // Save Twitter
        photoUrl: photoUrl
      });

      // ✅ CONFIRMATION MESSAGE
      Alert.alert("Profile Updated ✅", "Your profile photo, details, and social links have been successfully saved!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ffd700" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>This info appears on the "The Troupe" page.</Text>

      {/* Image Upload */}
      <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}><Text style={styles.placeholderText}>Add Photo</Text></View>
        )}
        <Text style={styles.editBadge}>EDIT</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          value={form.name} 
          onChangeText={(t) => setForm({...form, name: t})}
        />

        <Text style={styles.label}>Display Role (e.g. President, Actor)</Text>
        <TextInput 
          style={styles.input} 
          value={form.role} 
          onChangeText={(t) => setForm({...form, role: t})}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.cats}>
          {['Core Team', 'Actors', 'Creative'].map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setForm({...form, category: cat})}
              style={[styles.catBtn, form.category === cat && styles.catBtnActive]}
            >
              <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Social Links (Optional)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Instagram Profile URL"
          placeholderTextColor="#666"
          value={form.instagram} 
          onChangeText={(t) => setForm({...form, instagram: t})}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Twitter/X Profile URL"
          placeholderTextColor="#666"
          value={form.twitter} 
          onChangeText={(t) => setForm({...form, twitter: t})}
        />

        <Text style={styles.label}>Short Bio</Text>
        <TextInput 
          style={[styles.input, {height: 100}]} 
          multiline 
          value={form.bio} 
          onChangeText={(t) => setForm({...form, bio: t})}
          placeholder="Tell the world about you..."
          placeholderTextColor="#666"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Save Profile</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold' },
  subtitle: { color: '#666', marginBottom: 20 },
  imageWrapper: { alignSelf: 'center', marginBottom: 20 },
  image: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#ffd700' },
  placeholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  placeholderText: { color: '#666' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#ffd700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 10, fontWeight: 'bold' },
  form: { gap: 10 },
  label: { color: '#888', fontSize: 12, marginTop: 5 },
  input: { backgroundColor: '#1a1a1a', color: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  cats: { flexDirection: 'row', gap: 10 },
  catBtn: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  catBtnActive: { backgroundColor: '#ffd700', borderColor: '#ffd700' },
  catText: { color: '#888' },
  catTextActive: { color: 'black', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#ffd700', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { fontWeight: 'bold', fontSize: 16 }
});