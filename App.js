import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen'; // Você precisará criar esta
import ChatScreen from './screens/ChatScreen';
import PlanningScreen from './screens/PlanningScreen';
import MetricsScreen from './screens/MetricsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
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
  );
}