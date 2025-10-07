import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import PlanningScreen from './screens/PlanningScreen';
import MetricsScreen from './screens/MetricsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Inclui TODAS as bordas seguras, inclusive o bottom */}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F7F7F7' }}
        edges={['top', 'right', 'left', 'bottom']}  // 👈 importante
      >
        {/* Evita que o teclado esconda o conteúdo (Android e iOS) */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerTintColor: '#333',
                headerStyle: { backgroundColor: 'white' },
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CalculAI' }} />
              <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Professor IA' }} />
              <Stack.Screen name="Planning" component={PlanningScreen} options={{ title: 'Plano de Estudos' }} />
              <Stack.Screen name="Metrics" component={MetricsScreen} options={{ title: 'Desempenho' }} />
            </Stack.Navigator>
          </NavigationContainer>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}