import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRole(data.role);
        setUserData(data);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); router.replace('/'); } catch (error) { Alert.alert("Error", "Failed to logout"); }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ffd700" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{userData?.name || 'Artist'} 👋</Text>
          <Text style={styles.roleBadge}>{role?.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>MY ACCOUNT</Text>
      <View style={styles.section}>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.miniCard} onPress={() => router.push('/notices')}>
            <Text style={styles.cardIcon}>🔔</Text>
            <Text style={styles.cardTitle}>Notices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniCard} onPress={() => router.push('/profile')}>
            <Text style={styles.cardIcon}>👤</Text>
            <Text style={styles.cardTitle}>My Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADMIN TOOLS</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.miniCard} onPress={() => router.push('/applications')}>
              <Text style={styles.cardIcon}>📄</Text>
              <Text style={styles.cardTitle}>Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniCard} onPress={() => router.push('/manage-members')}>
              <Text style={styles.cardIcon}>👥</Text>
              <Text style={styles.cardTitle}>Manage Members</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniCard} onPress={() => router.push('/club-settings')}>
              <Text style={styles.cardIcon}>⚙️</Text>
              <Text style={styles.cardTitle}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniCard} onPress={() => router.push('/website-editor')}>
              <Text style={styles.cardIcon}>✍️</Text>
              <Text style={styles.cardTitle}>Edit Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 60 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: '#888', fontSize: 18 },
  username: { color: 'white', fontSize: 28, fontWeight: 'bold', fontFamily: 'serif' },
  roleBadge: { color: '#ffd700', fontWeight: 'bold', fontSize: 12, marginTop: 5, letterSpacing: 1 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#444', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  miniCard: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333', width: '47%', alignItems: 'center' },
  cardIcon: { fontSize: 24, marginBottom: 5 },
  cardTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  logoutBtn: { marginTop: 10, backgroundColor: '#2a2a2a', padding: 15, borderRadius: 8, alignItems: 'center', width: '100%' },
  logoutText: { color: '#ff4444', fontWeight: 'bold' }
});