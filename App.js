import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Purchases from 'react-native-purchases';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE.firebaseapp.com",
  projectId: "PASTE",
  storageBucket: "PASTE.appspot.com",
  messagingSenderId: "PASTE",
  appId: "PASTE"
};

initializeApp(firebaseConfig);
const auth = getAuth();

/* ================= CONTEXT ================= */
const AppContext = createContext();
const useApp = () => useContext(AppContext);

const Stack = createStackNavigator();

/* ================= AUTH SCREEN ================= */
function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      Alert.alert("Login failed");
    }
  };

  const signup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch {
      Alert.alert("Signup failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Pressable style={styles.button} onPress={login}><Text style={styles.buttonText}>Login</Text></Pressable>
      <Pressable onPress={signup}><Text style={styles.link}>Create Account</Text></Pressable>
    </View>
  );
}

/* ================= PAYWALL ================= */
function PaywallScreen() {
  const { setIsPro } = useApp();

  const subscribe = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      await Purchases.purchasePackage(offerings.current.availablePackages[0]);
      setIsPro(true);
    } catch {}
  };

  const restore = async () => {
    const info = await Purchases.restorePurchases();
    if (info.entitlements.active.pro) setIsPro(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go Pro</Text>
      <Pressable style={styles.button} onPress={subscribe}><Text style={styles.buttonText}>Subscribe</Text></Pressable>
      <Pressable onPress={restore}><Text style={styles.link}>Restore Purchase</Text></Pressable>
    </View>
  );
}

/* ================= DASHBOARD ================= */
function Dashboard() {
  const { isPro } = useApp();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Pro Status: {isPro ? "✅ Pro" : "❌ Free"}</Text>
      <Pressable style={styles.button} onPress={() => signOut(auth)}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

/* ================= ROOT ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    Purchases.configure({ apiKey: "PASTE_REVENUECAT_ANDROID_KEY" });
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <AppContext.Provider value={{ isPro, setIsPro }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : !isPro ? (
            <Stack.Screen name="Paywall" component={PaywallScreen} />
          ) : (
            <Stack.Screen name="Dashboard" component={Dashboard} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 10 }
});
