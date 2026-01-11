import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function Layout() {
  return (
    <>
      {/* Ensures Status Bar text (Time, Battery) is White */}
      <StatusBar barStyle="light-content" />
      
      <Stack 
        screenOptions={{
          headerShown: false, // This hides the header globally
          contentStyle: { 
            backgroundColor: '#0a0a0a', 
            paddingTop: 50, // Adds global padding so titles don't stick to the top edge
          }, 
          animation: 'slide_from_right' // Optional: Adds smooth transitions
        }} 
      />
    </>
  );
}