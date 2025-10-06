import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MetricsScreen = () => {
  const [metrics, setMetrics] = useState({
    accuracy: 0.75, // Example: 75% accuracy
    hoursStudied: 20, // Example: 20 hours studied
    recordHours: 5, // Example: 5 hours record
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const storedMetrics = await AsyncStorage.getItem('metrics');
        if (storedMetrics) {
          setMetrics(JSON.parse(storedMetrics));
        }
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    };

    loadMetrics();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desempenho e Métricas</Text>
      <Text style={styles.metric}>Percentual de Acertos: {metrics.accuracy * 100}%</Text>
      <Text style={styles.metric}>Total de Horas Estudadas: {metrics.hoursStudied}h</Text>
      <Text style={styles.metric}>Recorde de Horas: {metrics.recordHours}h</Text>
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
  metric: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
});

export default MetricsScreen;