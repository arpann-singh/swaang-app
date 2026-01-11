import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { db, storage } from '../firebaseConfig';

export default function ManageProductionsScreen() {
  const router = useRouter();
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "productions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setProductions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleFeatured = async (id, currentState) => {
    try {
      await updateDoc(doc(db, "productions", id), { isFeatured: !currentState });
    } catch (error) {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const handleDelete = async (id, imageUrl) => {
    Alert.alert("Delete Play", "This will remove it from the website gallery.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteDoc(doc(db, "productions", id));
            if(imageUrl && imageUrl.includes('firebase')) {
              try {
                const imgRef = ref(storage, imageUrl);
                await deleteObject(imgRef);
              } catch(e) { console.log(e) }
            }
            Alert.alert("Deleted", "Production removed.");
          } catch (error) {
            Alert.alert("Error", "Failed to delete.");
          }
      }}
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtext}>{item.year} • {item.type}</Text>
      </View>
      
      <View style={styles.actions}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Featured</Text>
          <Switch 
            value={item.isFeatured || false} 
            onValueChange={() => toggleFeatured(item.id, item.isFeatured)}
            trackColor={{ false: "#333", true: "#ffd700" }}
            thumbColor={item.isFeatured ? "#fff" : "#f4f3f4"}
          />
        </View>
        
        {/* EDIT BUTTON */}
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push({ pathname: '/add-production', params: { id: item.id } })}
        >
          <Text style={{fontSize: 18}}>✏️</Text>
        </TouchableOpacity>

        {/* DELETE BUTTON */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.image)}>
          <Text style={{fontSize: 18}}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Manage Plays</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-production')}>
          <Text style={styles.addBtnText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#ffd700" /> : (
        <FlatList 
          data={productions} 
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
  pageTitle: { fontSize: 28, color: '#ffd700', fontFamily: 'serif', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#ffd700', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  addBtnText: { color: 'black', fontWeight: 'bold' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#ffd700' },
  info: { flex: 1 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subtext: { color: '#888', fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchContainer: { alignItems: 'center', marginRight: 5 },
  switchLabel: { color: '#666', fontSize: 10, marginBottom: 5 },
  actionBtn: { padding: 5, backgroundColor: '#2a2a2a', borderRadius: 8 }
});