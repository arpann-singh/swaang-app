import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function CreateChatScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isEventGroup, setIsEventGroup] = useState(false);
  const [eventDate, setEventDate] = useState(''); // YYYY-MM-DD
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Check Admin Status
    const checkRole = async () => {
      const user = auth.currentUser;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists() && docSnap.data().role === 'admin') setIsAdmin(true);
    };
    checkRole();

    // 2. Fetch Users
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== auth.currentUser.uid); // Exclude self
      setUsers(list);
    };
    fetchUsers();
  }, []);

  const toggleUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Select at least one member.");
      return;
    }
    if ((selectedUsers.length > 1 || isEventGroup) && !groupName) {
      Alert.alert("Error", "Group name is required.");
      return;
    }

    try {
      const type = isEventGroup ? 'event' : selectedUsers.length > 1 ? 'group' : 'direct';
      
      // FIX: Store Names so we know who is who later
      const currentUserDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const currentUserName = currentUserDoc.data().name;

      const participantNames = {};
      participantNames[auth.currentUser.uid] = currentUserName; // Add Self
      
      // Add selected users
      selectedUsers.forEach(uid => {
        const u = users.find(user => user.id === uid);
        if (u) participantNames[uid] = u.name;
      });
      
      await addDoc(collection(db, "chats"), {
        type,
        name: groupName || "Chat",
        participants: [auth.currentUser.uid, ...selectedUsers],
        participantNames: participantNames, // Saved map of UID -> Name
        eventDate: isEventGroup ? eventDate : null, 
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create chat.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Message</Text>

      {/* Group Name Input */}
      {(selectedUsers.length > 1 || isEventGroup) && (
        <TextInput 
          style={styles.input} 
          placeholder="Group Name" 
          placeholderTextColor="#666"
          value={groupName}
          onChangeText={setGroupName}
        />
      )}

      {/* Admin Event Toggle */}
      {isAdmin && (
        <View style={styles.adminRow}>
          <View>
            <Text style={styles.label}>Event Group?</Text>
            <Text style={styles.subLabel}>Auto-disable after date</Text>
          </View>
          <Switch 
            value={isEventGroup} 
            onValueChange={setIsEventGroup}
            trackColor={{ false: "#333", true: "#ffd700" }} 
          />
        </View>
      )}

      {isEventGroup && (
        <TextInput 
          style={styles.input} 
          placeholder="Event Date (YYYY-MM-DD)" 
          placeholderTextColor="#666"
          value={eventDate}
          onChangeText={setEventDate}
        />
      )}

      <Text style={styles.sectionHeader}>Select Members</Text>
      
      <FlatList 
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.userRow, selectedUsers.includes(item.id) && styles.selectedRow]} 
            onPress={() => toggleUser(item.id)}
          >
            <Text style={[styles.userName, selectedUsers.includes(item.id) && {color: 'black'}]}>
              {item.name}
            </Text>
            {selectedUsers.includes(item.id) && <Text>✓</Text>}
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
        <Text style={styles.btnText}>Start Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 28, color: '#ffd700', fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#1a1a1a', color: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  adminRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#1a1a1a', borderRadius: 8, borderColor: '#ffd700', borderWidth: 1 },
  label: { color: 'white', fontWeight: 'bold' },
  subLabel: { color: '#888', fontSize: 10 },
  sectionHeader: { color: '#666', marginTop: 10, marginBottom: 10 },
  userRow: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', justifyContent: 'space-between' },
  selectedRow: { backgroundColor: '#ffd700', borderRadius: 8, borderBottomWidth: 0 },
  userName: { color: 'white', fontSize: 16 },
  createBtn: { backgroundColor: '#ffd700', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
});