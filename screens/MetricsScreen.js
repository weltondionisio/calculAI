import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Image, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const MetricsScreen = () => {
  const [metrics, setMetrics] = useState({
    totalStudyHours: 0,
    avgStudyHoursPerDay: 0,
    tasksCompleted: 0,
    currentStreak: 0,
  });

  const [tasks, setTasks] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]); 
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskHours, setNewTaskHours] = useState('');

  useEffect(() => {
    loadTasks();
    loadHistory();
  }, []);

  const dateOnly = (d) => new Date(d).toISOString().split('T')[0];

  const loadTasks = async () => {
    try {
      const json = await AsyncStorage.getItem('@todoTasks');
      const savedTasks = json ? JSON.parse(json) : [];
      setTasks(savedTasks);
      updateMetrics(savedTasks, completedHistory);
    } catch (error) { console.error(error); }
  };

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem('@completedHistory');
      const savedHistory = json ? JSON.parse(json) : [];
      setCompletedHistory(savedHistory);
      updateMetrics(tasks, savedHistory);
    } catch (error) { console.error(error); }
  };

  const updateMetrics = (taskList, historyList) => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);

    const countedTasks = historyList.filter(h => h.counted);
    const recentTasks = countedTasks.filter(t => new Date(t.date) >= weekAgo);

    const totalHours = recentTasks.reduce((sum, t) => sum + Number(t.hours), 0);
    const totalHoursRounded = Number(totalHours.toFixed(2));

    const daysSet = new Set(recentTasks.map(t => dateOnly(t.date)));
    const avgPerDay = daysSet.size > 0 ? Number((totalHours / daysSet.size).toFixed(2)) : 0;

    const uniqueDates = Array.from(daysSet).sort();
    let streak = 0;
    if (uniqueDates.length > 0) {
      let lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
      streak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(uniqueDates[i]);
        const diffDays = Math.round((lastDate - currentDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak++;
        else break;
        lastDate = currentDate;
      }
    }

    setMetrics({
      totalStudyHours: totalHoursRounded,
      avgStudyHoursPerDay: avgPerDay,
      tasksCompleted: countedTasks.length,
      currentStreak: streak,
    });
  };

  const addTask = () => {
    if (!newTaskName.trim() || !newTaskHours.trim()) {
      Alert.alert('Erro', 'Informe o nome e a duração da tarefa em horas.');
      return;
    }

    const task = {
      id: Date.now().toString(),
      text: newTaskName,
      hours: Number(newTaskHours),
      completed: false,
      date: new Date().toISOString(),
    };

    const newTasks = [task, ...tasks];
    setTasks(newTasks);
    AsyncStorage.setItem('@todoTasks', JSON.stringify(newTasks)).catch(console.error);

    setNewTaskName('');
    setNewTaskHours('');
  };

  const toggleTaskCompletion = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (completedHistory.some(h => h.id === task.id)) return;

    const updatedTasks = tasks.map(t => {
      if (t.id === id) return { ...t, completed: true, date: new Date().toISOString() };
      return t;
    });

    const newHistory = [
      ...completedHistory,
      { ...task, completed: true, counted: true, date: new Date().toISOString() }
    ];

    setTasks(updatedTasks);
    setCompletedHistory(newHistory);
    updateMetrics(updatedTasks, newHistory);

    AsyncStorage.setItem('@todoTasks', JSON.stringify(updatedTasks)).catch(console.error);
    AsyncStorage.setItem('@completedHistory', JSON.stringify(newHistory)).catch(console.error);
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    AsyncStorage.setItem('@todoTasks', JSON.stringify(updatedTasks)).catch(console.error);
  };

  const MetricCard = ({ title, value, unit, color }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );

  const renderTaskItem = ({ item }) => {
    const isCounted = completedHistory.some(h => h.id === item.id);
    return (
      <View style={styles.taskItem}>
        <TouchableOpacity
          onPress={() => toggleTaskCompletion(item.id)}
          style={styles.checkbox}
          disabled={isCounted}
        >
          {item.completed && <MaterialIcons name="check" size={20} color="white" />}
        </TouchableOpacity>

        <Text style={[styles.taskText, item.completed && { textDecorationLine: 'line-through', color: '#999' }]}>
          {item.text} ({item.hours}h)
        </Text>

        <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
          <MaterialIcons name="delete" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id}
      renderItem={renderTaskItem}
      contentContainerStyle={styles.contentContainer}
      ListHeaderComponent={
        <>
          <Image
            source={require('../assets/iconstudy.png')}
            style={{ width: screenWidth * 0.3, height: screenWidth * 0.3, alignSelf: 'center', marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Seu Desempenho Semanal</Text>
          <Text style={styles.headerSubtitle}>Acompanhe suas metas de estudo.</Text>

          <View style={styles.metricsGrid}>
            <MetricCard title="Horas Totais de Estudo" value={metrics.totalStudyHours} unit="h" color="#007AFF" />
            <MetricCard title="Média por Dia" value={metrics.avgStudyHoursPerDay} unit="h/dia" color="#4CDA64" />
            <MetricCard title="Tarefas Concluídas" value={metrics.tasksCompleted} unit="tarefas" color="#FF9500" />
            <MetricCard title="Dias Seguidos" value={metrics.currentStreak} unit="dias" color="#FF3B30" />
          </View>

          <Text style={styles.sectionTitle}>📋 Lista de tarefas</Text>
          <View style={styles.addTaskContainer}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              value={newTaskName}
              onChangeText={setNewTaskName}
              placeholder="Nome da tarefa"
            />
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={newTaskHours}
              onChangeText={setNewTaskHours}
              placeholder="Horas"
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={addTask} style={styles.addButton}>
              <MaterialIcons name="event-note" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {tasks.length === 0 && (
            <Text style={{ color: '#666', marginVertical: 20 }}>Nenhuma tarefa adicionada.</Text>
          )}
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  headerSubtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
  },
  cardTitle: { fontSize: 14, color: '#888', marginTop: 5 },
  cardValue: { fontSize:32, fontWeight:'900', lineHeight:38 },
  cardUnit: { fontSize:14, fontWeight:'600', color:'#555' },
  sectionTitle: { fontSize:18, fontWeight:'bold', color:'#333', marginBottom:10 },
  addTaskContainer: { flexDirection:'row', marginBottom:20, alignItems:'center' },
  input: { borderWidth:1, borderColor:'#A1C4FC', borderRadius:25, paddingHorizontal:15, paddingVertical:10 },
  addButton: { backgroundColor:'#A1C4FC', borderRadius:25, padding:12, justifyContent:'center', alignItems:'center' },
  taskItem: { flexDirection:'row', alignItems:'center', marginBottom:12, justifyContent:'space-between' },
  taskText: { fontSize:16, color:'#333', marginLeft:10, flex:1 },
  checkbox: { width:24, height:24, borderRadius:12, borderWidth:2, borderColor:'#007AFF', justifyContent:'center', alignItems:'center', backgroundColor:'#007AFF20', marginRight:8 },
  deleteButton: { marginLeft:8 },
});

export default MetricsScreen;