import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CalculAI</Text>
      
      {/* BOTÃO 1: CHAT */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#A1C4FC' }]}
        onPress={() => navigation.navigate('Chat')}
      >
        <Text style={styles.buttonText}>🤖 Professor IA (Chat)</Text>
      </TouchableOpacity>

      {/* BOTÃO 2: PLANEJAMENTO */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#FFF699' }]}
        onPress={() => navigation.navigate('Planning')}
      >
        <Text style={styles.buttonText}>🗓️ Meu Plano de Estudos</Text>
      </TouchableOpacity>

      {/* BOTÃO 3: DESEMPENHO */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#B6EEA7' }]}
        onPress={() => navigation.navigate('Metrics')}
      >
        <Text style={styles.buttonText}>📈 Desempenho e Métricas</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    width: '90%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333', // Cor escura para contrastar com a paleta suave
  }
});

export default HomeScreen;