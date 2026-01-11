import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

export default function ClubSettingsScreen() {
  const router = useRouter();
  const [whatsappLink, setWhatsappLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "site_content", "config"));
        if (docSnap.exists()) {
          setWhatsappLink(docSnap.data().whatsappLink || '');
        }
      } catch (error) {
        Alert.alert("Error", "Could not load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!whatsappLink.includes('chat.whatsapp.com')) {
      Alert.alert("Invalid Link", "Please enter a valid WhatsApp Group invite link.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "site_content", "config"), {
        whatsappLink: whatsappLink,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      Alert.alert("Success ✅", "WhatsApp link updated for all future acceptance emails.");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ffd700" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Club Settings</Text>
      <Text style={styles.subtitle}>Configure global links and system variables.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Official WhatsApp Group Link</Text>
        <TextInput 
          style={styles.input} 
          placeholder="https://chat.whatsapp.com/..." 
          placeholderTextColor="#666"
          value={whatsappLink}
          onChangeText={setWhatsappLink}
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>
          This link is automatically included in the acceptance email sent to new members.
        </Text>

        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Save Configuration</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold' },
  subtitle: { color: '#888', marginBottom: 30 },
  form: { gap: 10 },
  label: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  helpText: { color: '#666', fontSize: 12, fontStyle: 'italic', marginBottom: 15 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 15, color: 'white', fontSize: 16 },
  btn: { backgroundColor: '#ffd700', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});