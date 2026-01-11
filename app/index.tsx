import { Ionicons } from '@expo/vector-icons'; // Built-in icons for Expo
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // 1. AUTO-LOGIN CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard' as any);
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const generateMemberId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SW-${year}-${random}`;
  };

  const handleAuth = async () => {
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // --- SIGN UP ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const newMemberId = generateMemberId();

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          memberId: newMemberId,
          name: name,
          email: email,
          role: "pending",
          createdAt: new Date().toISOString()
        });
        
        Alert.alert("Account Created", `Your Member ID is ${newMemberId}. Please wait for Admin approval.`);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffd700" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1507676184212-d03816a98fce?q=80&w=2069&auto=format&fit=crop' }} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Dark Overlay for readability */}
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.logoContainer}>
              <View style={styles.logosRow}>
                {/* College Logo */}
                <Image 
                  source={require('../assets/college_logo.png')} 
                  style={styles.logo} 
                  resizeMode="contain"
                />
                
                {/* Swaang Logo */}
                <Image 
                  source={require('../assets/logo.png')} 
                  style={styles.logo} 
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.logoText}>SWAANG</Text>
              <Text style={styles.tagline}>The Official Dramatic Club of SSTC</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.headerTitle}>{isLogin ? "Welcome Back" : "Join the Club"}</Text>
              
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={20} color="#ffaaaa" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#666"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                )}
                
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                {isLogin && (
                  <TouchableOpacity 
                    style={styles.rememberRow} 
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={12} color="black" />}
                    </View>
                    <Text style={styles.rememberText}>Remember Me</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.buttonText}>{isLogin ? "LOGIN" : "CREATE ACCOUNT"}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>
                    {isLogin ? "New to Swaang?" : "Already a member?"}
                  </Text>
                  <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
                    <Text style={styles.switchText}>
                      {isLogin ? "Register Now" : "Login Here"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: width, height: height },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }, // Darken background
  keyboardContainer: { flex: 1 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  
  logoContainer: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
  logosRow: { flexDirection: 'row', gap: 20, marginBottom: 10 }, // New style for side-by-side logos
  logo: { width: 100, height: 100 }, // Adjusted size to fit two logos
  logoText: { fontSize: 48, fontWeight: 'bold', color: '#ffd700', fontFamily: 'serif', letterSpacing: 4 },
  tagline: { fontSize: 16, color: '#ccc', fontStyle: 'italic', marginTop: 5 },

  card: {
    backgroundColor: 'rgba(20, 20, 20, 0.85)', // Glass effect
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  headerTitle: { fontSize: 24, color: 'white', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 0, 0, 0.1)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#500' },
  errorText: { color: '#ffaaaa', fontSize: 14, marginLeft: 10, flex: 1 },

  form: { gap: 15 },
  
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0a0a0a', 
    borderWidth: 1, 
    borderColor: '#333', 
    borderRadius: 12, 
    paddingHorizontal: 15,
    height: 55
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: 'white', fontSize: 16, height: '100%' },

  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  rememberText: { color: '#aaa', marginLeft: 10, fontSize: 14 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#666', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  checkboxChecked: { backgroundColor: '#ffd700', borderColor: '#ffd700' },

  button: { 
    backgroundColor: '#ffd700', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 15,
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 5 },
  switchLabel: { color: '#888' },
  switchText: { color: '#ffd700', fontWeight: 'bold' },
});