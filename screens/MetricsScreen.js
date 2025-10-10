import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Image, Dimensions, ScrollView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; // ✅ copiar texto

const { width: screenWidth } = Dimensions.get('window');

let ViewShot, Share;
if (Platform.OS !== 'web') {
  ViewShot = require('react-native-view-shot').default;
  Share = require('react-native-share').default;
}

const MetricsScreen = () => {
  const { theme, isDark } = useContext(require('../ThemeContext').ThemeContext);
  const metricsContainerRef = useRef(null);

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

  useEffect(() => { loadData(); }, []);

  const dateOnly = (d) => new Date(d).toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem('@todoTasks');
      const savedTasks = tasksJson ? JSON.parse(tasksJson) : [];
      const historyJson = await AsyncStorage.getItem('@completedHistory');
      const savedHistory = historyJson ? JSON.parse(historyJson) : [];

      setTasks(savedTasks);
      setCompletedHistory(savedHistory);
      updateMetrics(savedTasks, savedHistory);
    } catch (error) { console.error(error); }
  };

  const updateMetrics = (taskList, historyList) => {
    const today = new Date();
    const weekAgo = new Date(); weekAgo.setDate(today.getDate() - 6);

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

    setNewTaskName(''); setNewTaskHours('');
  };

  const toggleTaskCompletion = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (completedHistory.some(h => h.id === task.id)) return;

    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: true, date: new Date().toISOString() } : t);
    const newHistory = [...completedHistory, { ...task, completed: true, counted: true, date: new Date().toISOString() }];

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

  // ✅ Copiar tarefa individual
  const copyTask = async (task) => {
    try {
      const text = `${task.text} (${task.hours}h)`;
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        await Clipboard.setStringAsync(text);
      }
      Alert.alert('Copiado', `Tarefa "${task.text}" copiada para a área de transferência.`);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível copiar a tarefa.');
    }
  };

  // ===== captura + download estilo story =====
  const captureAndShare = async () => {
    if (Platform.OS === 'web') {
      try {
        const htmlToImage = (await import('html-to-image')).default;
        const node = document.getElementById('storyContainer');
        if (!node) return;
        const dataUrl = await htmlToImage.toPng(node);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'metrics_story.png';
        link.click();
      } catch (err) {
        console.error(err);
        alert('Não foi possível gerar a imagem no Web.');
      }
      return;
    }

    try {
      if (!metricsContainerRef.current) return;
      const uri = await metricsContainerRef.current.capture({ format: 'png', quality: 1 });
      await Share.open({ url: uri, type: 'image/png', title: 'Compartilhar Métricas' });
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível compartilhar a imagem.');
    }
  };

  // ✅ Copiar todas as tarefas
  const copyAllTasksToClipboard = async () => {
    try {
      const pendingTasks = tasks.filter(t => !completedHistory.some(h => h.id === t.id));
      if (pendingTasks.length === 0) {
        Alert.alert('Nenhuma tarefa', 'Não há tarefas pendentes para copiar.');
        return;
      }

      const allText = pendingTasks.map(t => `${t.text} (${t.hours}h)`).join('\n');

      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(allText);
      } else {
        await Clipboard.setStringAsync(allText);
      }
      Alert.alert('Copiado', 'Todas as tarefas pendentes foram copiadas.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível copiar as tarefas.');
    }
  };

  const MetricCard = ({ title, value, unit, color }) => (
    <View style={[styles.card, { borderLeftColor: color, backgroundColor: theme.card, shadowColor: isDark ? '#000' : '#333' }]}>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={[styles.cardUnit, { color: theme.text }]}>{unit}</Text>
      <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{title}</Text>
    </View>
  );

  const StoryWrapper = Platform.OS !== 'web' ? ViewShot : View;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background, minHeight: '100vh' }}
      contentContainerStyle={{ padding: 20 }}
    >
      <StoryWrapper
        ref={metricsContainerRef}
        style={[styles.storyContainer, { backgroundColor: theme.card }]}
        {...(Platform.OS === 'web' ? { id: 'storyContainer' } : {})}
      >
        <View style={styles.metricsRow}>
          <Image source={require('../assets/iconstudy.png')} style={styles.storyIcon} resizeMode="contain" />
          <View style={styles.metricsGridStory}>
            <MetricCard title="Horas Totais" value={metrics.totalStudyHours} unit="h" color="#007AFF" />
            <MetricCard title="Média/Dia" value={metrics.avgStudyHoursPerDay} unit="h/dia" color="#4CDA64" />
            <MetricCard title="Tarefas" value={metrics.tasksCompleted} unit="concluídas" color="#FF9500" />
            <MetricCard title="Dias Seguidos" value={metrics.currentStreak} unit="dias" color="#FF3B30" />
          </View>
        </View>
      </StoryWrapper>

      <TouchableOpacity onPress={captureAndShare} style={[styles.addButton, { backgroundColor: '#4CAF50', alignSelf: 'center', marginVertical: 15 }]}>
        <MaterialIcons name="share" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity onPress={copyAllTasksToClipboard} style={[styles.addButton, { backgroundColor: '#007AFF', alignSelf: 'center', marginBottom: 20 }]}>
        <MaterialIcons name="content-copy" size={24} color="white" />
      </TouchableOpacity>

      {/* 🟢 Botão grande de adicionar tarefa */}
      <TouchableOpacity onPress={addTask} style={[styles.addButton, { backgroundColor: theme.accent, alignSelf: 'center', marginBottom: 20, flexDirection: 'row' }]}>
        <MaterialIcons name="add-circle-outline" size={24} color="white" />
        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Adicionar Tarefa</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>📋 Lista de tarefas</Text>

      <View style={styles.addTaskContainer}>
        <TextInput
          style={[styles.input, { flex: 2, backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
          value={newTaskName} onChangeText={setNewTaskName}
          placeholder="Nome da tarefa" placeholderTextColor={theme.placeholder}
        />
        <TextInput
          style={[styles.input, { width: 80, marginHorizontal: 8, backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
          value={newTaskHours} onChangeText={setNewTaskHours}
          placeholder="Horas" keyboardType="numeric" placeholderTextColor={theme.placeholder}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isCounted = completedHistory.some(h => h.id === item.id);
          return (
            <View style={styles.taskItem}>
              <TouchableOpacity
                onPress={() => toggleTaskCompletion(item.id)}
                style={[styles.checkbox, { borderColor: theme.accent, backgroundColor: item.completed ? theme.accent : 'transparent' }]}
                disabled={isCounted}
              >
                {item.completed && <MaterialIcons name="check" size={20} color="white" />}
              </TouchableOpacity>
              <Text style={[styles.taskText, { color: theme.text }, item.completed && { textDecorationLine: 'line-through', color: theme.textSecondary }]} numberOfLines={1}>
                {item.text} ({item.hours}h)
              </Text>
              {/* ✅ Botão de copiar individual */}
              <TouchableOpacity onPress={() => copyTask(item)} style={{ marginLeft: 6 }}>
                <MaterialIcons name="content-copy" size={22} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
                <MaterialIcons name="delete" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      {tasks.length === 0 && (
        <Text style={{ color: theme.textSecondary, marginVertical: 20 }}>Nenhuma tarefa adicionada.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  storyContainer: {
    width: '100%',
    maxWidth: 700,
    minHeight: 220,
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
  },
  metricsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', width: '100%' },
  storyIcon: { width: 120, height: 120, marginRight: 20, marginBottom: 10 },
  metricsGridStory: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, flex: 1 },
  card: {
    flexBasis: '45%',
    maxWidth: 200,
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 14, marginTop: 5 },
  cardValue: { fontSize: 32, fontWeight: '900', lineHeight: 38 },
  cardUnit: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  addTaskContainer: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10 },
  addButton: { borderRadius: 25, padding: 12, justifyContent: 'center', alignItems: 'center' },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taskText: { fontSize: 16, marginLeft: 10, flex: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  deleteButton: { marginLeft: 8 },
});

export default MetricsScreen;