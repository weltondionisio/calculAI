import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const PlanningScreen = () => {
  const [topic, setTopic] = useState('');
  const [tasks, setTasks] = useState([]);

  const generateTasks = async () => {
    // Simulate LLM response (replace with actual API call)
    const simulatedTasks = [
      { id: '1', title: 'Revisar Fórmulas', completed: false },
      { id: '2', title: 'Fazer 10 Exercícios Simples', completed: false },
      { id: '3', title: 'Resolver Problemas Complexos', completed: false },
    ];
    setTasks(simulatedTasks);
    await AsyncStorage.setItem('planningTasks', JSON.stringify(simulatedTasks)); // Save to AsyncStorage
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={() => {}}>
        <Text>{item.completed ? '✅' : '⬜'} </Text>
      </TouchableOpacity>
      <Text>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Plano de Estudos</Text>
      <TextInput
        style={styles.input}
        placeholder="Tópico (ex: Equações de 2º Grau)"
        value={topic}
        onChangeText={setTopic}
      />
      <TouchableOpacity style={styles.button} onPress={generateTasks}>
        <Text style={styles.buttonText}>Gerar Plano</Text>
      </TouchableOpacity>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FFF699',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
});

export default PlanningScreen;