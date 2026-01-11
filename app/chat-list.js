import { useRouter } from 'expo-router';
import { collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function ChatListScreen() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState({}); // Store user ID -> Name mapping
  const user = auth.currentUser;

  useEffect(() => {
    // 1. Fetch All Users to resolve names (Fixes "Chat" name issue)
    const fetchUserMap = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const map = {};
        snap.docs.forEach(doc => {
          map[doc.id] = doc.data().name || "Member";
        });
        setUserMap(map);
      } catch (error) {
        console.log("Error fetching user map:", error);
      }
    };
    fetchUserMap();

    // 2. Listen for chats
    if (!user) return;
    
    const q = query(
      collection(db, "chats"), 
      where("participants", "array-contains", user.uid),
      orderBy("lastUpdated", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const renderItem = ({ item }) => {
    let chatName = item.name;
    
    // Logic: If Direct Message, find the OTHER person's name
    if (item.type === 'direct') {
        const otherId = item.participants.find(uid => uid !== user.uid);
        
        // Priority 1: Use name stored in Chat Document (Fastest)
        if (item.participantNames && item.participantNames[otherId]) {
            chatName = item.participantNames[otherId];
        } 
        // Priority 2: Use User Map fetched on load (Fallback for older chats)
        else if (otherId && userMap[otherId]) {
            chatName = userMap[otherId];
        }
        // Priority 3: Fallback text
        else {
            chatName = "Member";
        }
    }

    return (
      <TouchableOpacity 
        style={[styles.card, item.type === 'event' && styles.eventCard]} 
        onPress={() => router.push({ pathname: '/chat-room', params: { id: item.id, name: chatName } })}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{item.type === 'event' ? '📅' : item.type === 'group' ? '👥' : '👤'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{chatName}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || "No messages yet"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/create-chat')}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#ffd700" style={{marginTop: 20}} />
      ) : chats.length === 0 ? (
        <Text style={styles.empty}>No conversations yet.</Text>
      ) : (
        <FlatList 
          data={chats}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#ffd700', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: 'black', fontSize: 24, fontWeight: 'bold' },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  eventCard: { borderLeftWidth: 4, borderLeftColor: '#ffd700' },
  iconContainer: { width: 40, height: 40, backgroundColor: '#333', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  name: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  lastMsg: { color: '#888', fontSize: 12, marginTop: 2 },
});