import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

export default function ManageMembersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(true); // New State

  // Edit Form State
  const [editRole, setEditRole] = useState(''); 
  const [editSystemRole, setEditSystemRole] = useState('member'); 
  const [editEvent, setEditEvent] = useState('');
  const [isFeatured, setIsFeatured] = useState(false); 

  useEffect(() => {
    fetchUsers();

    // Listen for Recruitment Status
    const unsubRecruitment = onSnapshot(doc(db, "site_content", "recruitment"), (docSnap) => {
      if (docSnap.exists()) {
        setIsRecruitmentOpen(docSnap.data().isOpen);
      }
    });

    return () => unsubRecruitment();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      userList.sort((a, b) => (a.role === 'pending' ? -1 : 1));
      setUsers(userList);
    } catch (error) {
      Alert.alert("Error", "Could not fetch members");
    } finally {
      setLoading(false);
    }
  };

  const toggleRecruitment = async (value) => {
    try {
      // Optimistic update
      setIsRecruitmentOpen(value);
      // Update Firebase
      await setDoc(doc(db, "site_content", "recruitment"), { isOpen: value }, { merge: true });
    } catch (error) {
      Alert.alert("Error", "Failed to update recruitment status.");
      setIsRecruitmentOpen(!value); // Revert
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditRole(user.displayRole || '');
    setEditSystemRole(user.role || 'member');
    setEditEvent(user.currentEvent || '');
    setIsFeatured(user.isFeatured || false); 
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        displayRole: editRole,
        role: editSystemRole,
        currentEvent: editEvent,
        isFeatured: isFeatured 
      });
      Alert.alert("Success", "Member details updated!");
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      Alert.alert("Error", "Update failed.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, item.role === 'pending' && styles.pendingCard]} onPress={() => openEditModal(item)}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name || "Unknown"} {item.isFeatured && "⭐"}</Text>
          <Text style={styles.email}>{item.memberId || "No ID"} • {item.email}</Text>
          <Text style={styles.subtext}>
            {item.role === 'pending' ? (
              <Text style={{color: '#ff4444', fontWeight: 'bold'}}>APPROVAL REQUIRED</Text>
            ) : (
              <>
                {item.displayRole || "Member"} • 
                <Text style={{color: item.role === 'admin' ? '#ffd700' : '#888'}}> {item.role?.toUpperCase()}</Text>
              </>
            )}
          </Text>
          {item.currentEvent ? <Text style={styles.eventBadge}>🎭 {item.currentEvent}</Text> : null}
        </View>
        <Text style={styles.editBtn}>EDIT</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Team</Text>

      {/* NEW: Recruitment Status Card */}
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>Recruitment Status</Text>
          <Text style={[styles.statusText, { color: isRecruitmentOpen ? '#4ade80' : '#ff4444' }]}>
            {isRecruitmentOpen ? "🟢 Applications OPEN" : "🔴 Applications CLOSED"}
          </Text>
        </View>
        <Switch 
          value={isRecruitmentOpen} 
          onValueChange={toggleRecruitment}
          trackColor={{ false: "#333", true: "#ffd700" }} 
          thumbColor={isRecruitmentOpen ? "#fff" : "#f4f3f4"} 
        />
      </View>

      {loading ? <ActivityIndicator color="#ffd700" size="large" /> : <FlatList data={users} renderItem={renderItem} keyExtractor={item => item.id} />}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Member</Text>
            
            <Text style={styles.label}>System Access Level</Text>
            <View style={styles.roleTabs}>
              {['pending', 'member', 'admin'].map((role) => (
                <TouchableOpacity 
                  key={role}
                  style={[styles.roleTab, editSystemRole === role && styles.roleTabActive]}
                  onPress={() => setEditSystemRole(role)}
                >
                  <Text style={[styles.roleTabText, editSystemRole === role && {color:'black'}]}>
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Club Role (Display Title)</Text>
            <TextInput style={styles.input} value={editRole} onChangeText={setEditRole} placeholder="e.g. Lead Actor" placeholderTextColor="#666" />

            <Text style={styles.label}>Assign to Event</Text>
            <TextInput style={styles.input} value={editEvent} onChangeText={setEditEvent} placeholder="e.g. Romeo & Juliet" placeholderTextColor="#666" />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Feature on Home Page?</Text>
              <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ false: "#333", true: "#ffd700" }} thumbColor={isFeatured ? "#fff" : "#f4f3f4"} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 20 },
  
  // New Status Card Styles
  statusCard: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statusTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  statusText: { fontSize: 12, fontWeight: 'bold' },

  card: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  pendingCard: { borderLeftWidth: 4, borderLeftColor: '#ff4444' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  name: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  email: { color: '#888', fontSize: 12 },
  subtext: { color: '#ccc', fontSize: 12, marginTop: 4 },
  eventBadge: { color: '#ffd700', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  editBtn: { color: '#ffd700', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#ffd700' },
  modalTitle: { fontSize: 24, color: 'white', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { color: '#888', marginBottom: 5, fontSize: 12 },
  input: { backgroundColor: '#000', color: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  roleTabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleTab: { padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#555', flex: 1, alignItems: 'center' },
  roleTabActive: { backgroundColor: '#ffd700', borderColor: '#ffd700' },
  roleTabText: { color: '#888', fontWeight: 'bold', fontSize: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, backgroundColor: '#ffd700', borderRadius: 8, alignItems: 'center' },
  cancelText: { color: 'white', fontWeight: 'bold' },
  saveText: { color: 'black', fontWeight: 'bold' },
});