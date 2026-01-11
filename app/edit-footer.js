import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

export default function EditFooterScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    aboutText: '',
    address: '',
    email: '',
    phone: '',
    instagram: '',
    facebook: '',
    youtube: '',
    twitter: ''
  });

  // 1. Fetch current footer data
  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const docRef = doc(db, "site_content", "footer");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setForm(docSnap.data());
      } else {
        // Default values if nothing exists yet
        setForm({
            aboutText: "The official dramatics society. Bringing stories to life since 2015.",
            address: "Student Activity Center, Main Campus Block B",
            email: "drama@college.edu",
            phone: "+91 98765 43210",
            instagram: "",
            facebook: "",
            youtube: "",
            twitter: ""
        });
      }
    } catch (error) {
      Alert.alert("Error", "Could not load footer data");
    } finally {
      setLoading(false);
    }
  };

  // 2. Save changes to Firebase
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "site_content", "footer"), {
        ...form,
        updatedAt: serverTimestamp()
      });
      Alert.alert("Success ✅", "Website footer updated instantly!");
    } catch (error) {
      Alert.alert("Error", "Failed to update footer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ffd700" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Website Footer</Text>
        
        <Text style={styles.sectionHeader}>General Info</Text>
        <Text style={styles.label}>About Text (Short description)</Text>
        <TextInput 
            style={[styles.input, {height: 80}]} 
            multiline 
            value={form.aboutText}
            onChangeText={(t) => setForm({...form, aboutText: t})}
            placeholderTextColor="#666"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput 
            style={styles.input} 
            value={form.address} 
            onChangeText={(t) => setForm({...form, address: t})} 
            placeholderTextColor="#666"
        />

        <Text style={styles.label}>Contact Email</Text>
        <TextInput 
            style={styles.input} 
            value={form.email} 
            onChangeText={(t) => setForm({...form, email: t})} 
            keyboardType="email-address" 
            placeholderTextColor="#666"
        />

        <Text style={styles.label}>Contact Phone</Text>
        <TextInput 
            style={styles.input} 
            value={form.phone} 
            onChangeText={(t) => setForm({...form, phone: t})} 
            keyboardType="phone-pad" 
            placeholderTextColor="#666"
        />

        <Text style={styles.sectionHeader}>Social Media Links</Text>
        <Text style={styles.label}>Instagram URL</Text>
        <TextInput style={styles.input} value={form.instagram} onChangeText={(t) => setForm({...form, instagram: t})} placeholder="https://..." placeholderTextColor="#666" />

        <Text style={styles.label}>Facebook URL</Text>
        <TextInput style={styles.input} value={form.facebook} onChangeText={(t) => setForm({...form, facebook: t})} placeholder="https://..." placeholderTextColor="#666" />

        <Text style={styles.label}>YouTube URL</Text>
        <TextInput style={styles.input} value={form.youtube} onChangeText={(t) => setForm({...form, youtube: t})} placeholder="https://..." placeholderTextColor="#666" />

        <Text style={styles.label}>Twitter/X URL</Text>
        <TextInput style={styles.input} value={form.twitter} onChangeText={(t) => setForm({...form, twitter: t})} placeholder="https://..." placeholderTextColor="#666" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Update Footer</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 28, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 20 },
  sectionHeader: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  label: { color: '#888', marginBottom: 5, fontSize: 12 },
  input: { backgroundColor: '#1a1a1a', color: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  saveBtn: { backgroundColor: '#ffd700', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  btnText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});