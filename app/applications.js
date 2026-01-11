import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const q = query(collection(db, "applications"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const sendAcceptanceEmail = async (applicant) => {
    // FETCH DYNAMIC LINK FROM CONFIG
    let whatsappLink = "https://chat.whatsapp.com/YOUR_DEFAULT_LINK"; // Fallback
    try {
      const configSnap = await getDoc(doc(db, "site_content", "config"));
      if (configSnap.exists() && configSnap.data().whatsappLink) {
        whatsappLink = configSnap.data().whatsappLink;
      }
    } catch (e) {
      console.log("Config error:", e);
    }

    const subject = encodeURIComponent("Swaang Dramatics Society: Application Update");
    const body = encodeURIComponent(
      `Hi ${applicant.fullName},\n\n` +
      `Congratulations! You have been accepted into the Swaang Dramatics Society for the role of ${applicant.role.toUpperCase()}.\n\n` +
      `To stay updated with rehearsals and meeting notices, please join our official WhatsApp group here:\n` +
      `${whatsappLink}\n\n` +
      `All further notices will be updated there.\n\n` +
      `Best regards,\n` +
      `Team SWAANG`
    );

    const mailUrl = `mailto:${applicant.email}?subject=${subject}&body=${body}`;
    Linking.openURL(mailUrl);
  };

  const handleAction = async (item, status) => {
    try {
      const appRef = doc(db, "applications", item.id);
      await updateDoc(appRef, {
        status: status,
        reviewedAt: serverTimestamp()
      });
      
      if (status === 'accepted') {
        Alert.alert(
          "Approved ✅", 
          "The member has been approved. Send the WhatsApp group invite via email now?",
          [
            { text: "No", onPress: () => fetchApplications() },
            { text: "Send Email", onPress: async () => {
                await sendAcceptanceEmail(item);
                fetchApplications();
            }}
          ]
        );
      } else {
        Alert.alert("Success", "Application rejected.");
        fetchApplications();
      }
    } catch (error) {
      Alert.alert("Error", "Could not update status");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.role}>{item.role}</Text>
      </View>
      <Text style={styles.info}>{item.email}</Text>
      <Text style={styles.info}>{item.phone}</Text>
      <Text style={styles.label}>Audition Message:</Text>
      <Text style={styles.reason}>"{item.whyJoin}"</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleAction(item, 'rejected')}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleAction(item, 'accepted')}>
          <Text style={styles.btnText}>Approve & Notify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auditions</Text>
      {loading ? (
        <ActivityIndicator color="#ffd700" size="large" />
      ) : applications.length === 0 ? (
        <Text style={styles.empty}>No pending applications.</Text>
      ) : (
        <FlatList 
          data={applications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 28, color: '#ffd700', fontFamily: 'serif', marginBottom: 20, fontWeight: 'bold' },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ffd700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  name: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  role: { color: '#ffd700', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  info: { color: '#aaa', fontSize: 14, marginBottom: 2 },
  label: { color: '#666', fontSize: 12, marginTop: 10, marginBottom: 4 },
  reason: { color: '#ddd', fontStyle: 'italic', marginBottom: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnReject: { backgroundColor: '#2a2a2a' },
  btnApprove: { backgroundColor: '#8a0000' },
  btnText: { color: 'white', fontWeight: 'bold' }
});