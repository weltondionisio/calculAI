import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MetricsScreen = () => { // OU MetricsScreen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela de Planejamento (V1)</Text>
      <Text style={styles.text}>Aqui o usuário verá o checklist gerado pela LLM.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
  }
});

export default MetricsScreen; // OU MetricsScreen