import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

export default function AddNoticeScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!title || !date) {
      Alert.alert("Missing Info", "Please add a title and date.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "notices"), {
        title,
        date, // e.g., "Friday, 5 PM"
        details,
        createdAt: serverTimestamp(),
        attendees: [] // Empty list of people who RSVP'd
      });

      // ✅ CONFIRMATION MESSAGE
      Alert.alert("Notice Posted ✅", "Your notice is now live on the board!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Could not post notice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Post New Notice</Text>
      <Text style={styles.subtitle}>Announce a rehearsal, meeting, or event.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Rehearsal for Romeo & Juliet" 
          placeholderTextColor="#666"
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Date & Time</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Tomorrow at 5:00 PM" 
          placeholderTextColor="#666"
          onChangeText={setDate}
        />

        <Text style={styles.label}>Details</Text>
        <TextInput 
          style={[styles.input, {height: 120}]} 
          placeholder="Script reading for Act 2. Bring your scripts!" 
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          onChangeText={setDetails}
        />

        <TouchableOpacity style={styles.btn} onPress={handlePost} disabled={loading}>
          {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Post Notice</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold' },
  subtitle: { color: '#888', marginBottom: 30 },
  form: { gap: 15 },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 15, color: 'white', fontSize: 16 },
  btn: { backgroundColor: '#ffd700', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});