import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router'; // Import Stack to configure header
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db, storage } from '../firebaseConfig';

export default function WebsiteEditorScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data States
  const [heroImage, setHeroImage] = useState(null);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [founder, setFounder] = useState({ name: '', role: '', message: '', image: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Hero
      const heroDoc = await getDoc(doc(db, "site_content", "home"));
      if (heroDoc.exists()) {
        const data = heroDoc.data();
        setHeroImage(data.heroImage);
        setHeroTitle(data.heroTitle || 'SWAANG');
        setHeroSubtitle(data.heroSubtitle || 'The Official Dramatics Society');
      }

      // 2. Fetch Founder
      const founderDoc = await getDoc(doc(db, "site_content", "founder"));
      if (founderDoc.exists()) setFounder(founderDoc.data());
      else setFounder({ name: 'Ankit Verma', role: 'Founder', message: 'Welcome...', image: null });

    } catch (error) {
      Alert.alert("Error", "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!result.canceled) {
      if (type === 'hero') setHeroImage(result.assets[0].uri);
      if (type === 'founder') setFounder({ ...founder, image: result.assets[0].uri });
    }
  };

  const uploadImage = async (uri, path) => {
    if (!uri || uri.startsWith('http')) return uri; // Already a URL
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload Images if changed
      const heroUrl = await uploadImage(heroImage, `site/hero_${Date.now()}`);
      const founderUrl = await uploadImage(founder.image, `site/founder_${Date.now()}`);

      // Save Hero Data
      await setDoc(doc(db, "site_content", "home"), { 
        heroImage: heroUrl, 
        heroTitle: heroTitle,
        heroSubtitle: heroSubtitle,
        updatedAt: serverTimestamp() 
      });

      // Save Founder Data
      await setDoc(doc(db, "site_content", "founder"), { 
        ...founder, 
        image: founderUrl, 
        updatedAt: serverTimestamp() 
      });

      Alert.alert("Success ✅", "Home page updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ffd700" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Hide the default navigation header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Home Page</Text>

        {/* HERO SECTION */}
        <Text style={styles.header}>Hero Section</Text>
        
        <Text style={styles.label}>Background Image</Text>
        <TouchableOpacity onPress={() => pickImage('hero')} style={styles.imagePicker}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroPreview} />
          ) : (
            <View style={[styles.heroPreview, styles.placeholder]}><Text style={styles.text}>Select Image</Text></View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Hero Title</Text>
        <TextInput 
          style={styles.input} 
          value={heroTitle} 
          onChangeText={setHeroTitle}
          placeholder="e.g. SWAANG" 
          placeholderTextColor="#666" 
        />

        <Text style={styles.label}>Hero Subtitle</Text>
        <TextInput 
          style={styles.input} 
          value={heroSubtitle} 
          onChangeText={setHeroSubtitle}
          placeholder="e.g. The Official Dramatics Society" 
          placeholderTextColor="#666" 
        />

        {/* FOUNDER SECTION */}
        <Text style={styles.header}>Founder Details</Text>
        <TouchableOpacity onPress={() => pickImage('founder')} style={styles.imagePicker}>
          {founder.image ? (
            <Image source={{ uri: founder.image }} style={styles.founderPreview} />
          ) : (
            <View style={[styles.founderPreview, styles.placeholder]}><Text style={styles.text}>Add Photo</Text></View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={founder.name} onChangeText={(t) => setFounder({...founder, name: t})} />

        <Text style={styles.label}>Role (e.g. Founder)</Text>
        <TextInput style={styles.input} value={founder.role} onChangeText={(t) => setFounder({...founder, role: t})} />

        <Text style={styles.label}>Message</Text>
        <TextInput 
          style={[styles.input, {height: 150}]} 
          multiline 
          value={founder.message} 
          onChangeText={(t) => setFounder({...founder, message: t})} 
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Publish Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  title: { fontSize: 28, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 20 },
  header: { fontSize: 18, color: 'white', fontWeight: 'bold', marginTop: 15, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  label: { color: '#888', marginBottom: 5, fontSize: 12 },
  input: { backgroundColor: '#1a1a1a', color: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  heroPreview: { width: '100%', height: 150, borderRadius: 10, resizeMode: 'cover' },
  founderPreview: { width: 100, height: 100, borderRadius: 50 },
  placeholder: { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' },
  text: { color: '#666' },
  saveBtn: { backgroundColor: '#ffd700', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 50 },
  btnText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});