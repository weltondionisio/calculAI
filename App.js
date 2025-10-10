import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// 🧩 IMPORTA O PROVIDER E O CONTEXTO
import { ThemeProvider, ThemeContext } from './ThemeContext';

import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import PlanningScreen from './screens/PlanningScreen';
import MetricsScreen from './screens/MetricsScreen';

const Stack = createStackNavigator();

// 🔹 Componente separado que consome o tema e monta a navegação
function MainNavigator() {
  const { isDark, theme } = useContext(ThemeContext);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerTintColor: theme.text,
            headerStyle: { backgroundColor: theme.card },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'calculAI' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'ProfessorIA' }}
          />
          <Stack.Screen
            name="Planning"
            component={PlanningScreen}
            options={{ title: 'Plano de Estudos' }}
          />
          <Stack.Screen
            name="Metrics"
            component={MetricsScreen}
            options={{ title: 'Desempenho e Métricas' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    // 🔹 Provider global para todo o app
    <ThemeProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <MainNavigator />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}