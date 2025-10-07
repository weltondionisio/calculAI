import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* O título da tela agora está no cabeçalho, mas podemos manter um na tela se quisermos */}
      <Text style={styles.welcomeText}>Bem-vindo ao seu tutor de Matemática</Text>
      
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
    backgroundColor: '#F5F5F5', // Fundo levemente cinza para contraste
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 40,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    width: '90%',
    padding: 18,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
    elevation: 2, // Sombra sutil para Android
    shadowColor: '#000', // Sombra sutil para iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  }
});

export default HomeScreen;