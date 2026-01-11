import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../firebaseConfig';

export default function ChatRoomScreen() {
  const { id, name } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Member"); // Default fallback
  const user = auth.currentUser;
  const flatListRef = useRef();

  useEffect(() => {
    // 1. Fetch MY Name (so messages I send have my name)
    const fetchMyName = async () => {
      const uDoc = await getDoc(doc(db, "users", user.uid));
      if (uDoc.exists()) {
        setCurrentUserName(uDoc.data().name);
      }
    };
    fetchMyName();

    // 2. Check Event Expiry
    const checkExpiry = async () => {
      const chatDoc = await getDoc(doc(db, "chats", id));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        if (data.type === 'event' && data.eventDate) {
          const eventDate = new Date(data.eventDate);
          if (new Date() > eventDate) {
            setIsExpired(true);
          }
        }
      }
    };
    checkExpiry();

    // 3. Listen for Messages
    const q = query(
      collection(db, "chats", id, "messages"), 
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Scroll to bottom on new message
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsub();
  }, [id]);

  const sendMessage = async (text = inputText, imageUrl = null) => {
    if ((!text && !imageUrl) || isExpired) return;

    try {
      await addDoc(collection(db, "chats", id, "messages"), {
        text: text,
        imageUrl: imageUrl,
        senderId: user.uid,
        senderName: currentUserName, // FIX: Use the fetched name
        createdAt: serverTimestamp()
      });

      // Update last message in chat doc
      await updateDoc(doc(db, "chats", id), {
        lastMessage: imageUrl ? "📷 Photo" : text,
        lastUpdated: serverTimestamp()
      });

      setInputText('');
    } catch (error) {
      console.error(error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `chats/${id}/${Date.now()}`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      sendMessage("", url);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.uid;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
        )}
        {item.text ? <Text style={styles.msgText}>{item.text}</Text> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{name}</Text>
        {isExpired && <Text style={styles.expiredBadge}>EVENT ENDED (READ ONLY)</Text>}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 15 }}
      />

      {!isExpired ? (
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <Text style={styles.attachIcon}>📷</Text>
          </TouchableOpacity>
          <TextInput 
            style={styles.input} 
            value={inputText} 
            onChangeText={setInputText} 
            placeholder="Type a message..." 
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()}>
            <Text style={styles.sendText}>→</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.expiredFooter}>
          <Text style={styles.expiredText}>This event has passed. Chat is disabled.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: '#111', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  expiredBadge: { color: '#ff4444', fontSize: 10, fontWeight: 'bold', borderWidth: 1, borderColor: '#ff4444', padding: 4, borderRadius: 4 },
  
  bubble: { padding: 10, borderRadius: 10, marginBottom: 10, maxWidth: '80%' },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#ffd700' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#333' },
  msgText: { color: 'black' }, // Default for Me
  senderName: { fontSize: 10, color: '#888', marginBottom: 2 },
  msgImage: { width: 150, height: 150, borderRadius: 8, marginBottom: 5 },

  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#333', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: 'white', padding: 10, borderRadius: 20, marginHorizontal: 10 },
  attachBtn: { padding: 5 },
  attachIcon: { fontSize: 20 },
  sendBtn: { backgroundColor: '#ffd700', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: 'black', fontSize: 20, fontWeight: 'bold' },
  
  expiredFooter: { padding: 20, alignItems: 'center', backgroundColor: '#1a0000' },
  expiredText: { color: '#ffaaaa' },
});