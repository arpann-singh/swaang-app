import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function NoticeBoardScreen() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    // 1. Fetch Role
    const fetchRole = async () => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setRole(docSnap.data().role);
      }
    };
    fetchRole();

    // 2. Real-time listener for notices
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleRSVP = async (noticeId, currentAttendees = []) => {
    const isAttending = currentAttendees.includes(user.uid);
    const noticeRef = doc(db, "notices", noticeId);

    try {
      if (isAttending) {
        await updateDoc(noticeRef, { attendees: arrayRemove(user.uid) });
      } else {
        await updateDoc(noticeRef, { attendees: arrayUnion(user.uid) });
      }
    } catch (error) {
      Alert.alert("Error", "Could not update RSVP.");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Notice", "Remove this notice?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteDoc(doc(db, "notices", id));
          } catch (error) {
            Alert.alert("Error", "Failed to delete.");
          }
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const isAttending = item.attendees?.includes(user.uid);
    const count = item.attendees?.length || 0;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
          {role === 'admin' && (
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={{fontSize: 18}}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.details}>{item.details}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.count}>{count} people going</Text>
          
          <TouchableOpacity 
            style={[styles.rsvpBtn, isAttending ? styles.going : styles.notGoing]}
            onPress={() => toggleRSVP(item.id, item.attendees)}
          >
            <Text style={[styles.rsvpText, isAttending && { color: 'black' }]}>
              {isAttending ? "✓ I'm In" : "Join"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Notice Board</Text>
      {loading ? (
        <ActivityIndicator color="#ffd700" size="large" />
      ) : notices.length === 0 ? (
        <Text style={styles.empty}>No notices posted yet.</Text>
      ) : (
        <FlatList 
          data={notices}
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
  pageTitle: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 20 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ffd700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  date: { color: '#ffd700', fontSize: 14, marginTop: 2 },
  details: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 },
  count: { color: '#666', fontSize: 12 },
  rsvpBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#ffd700' },
  notGoing: { backgroundColor: 'transparent' },
  going: { backgroundColor: '#ffd700' },
  rsvpText: { color: '#ffd700', fontWeight: 'bold', fontSize: 12 }
});