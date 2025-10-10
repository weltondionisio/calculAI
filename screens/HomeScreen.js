import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ThemeContext } from '../ThemeContext';

// Função auxiliar para obter a hora e data formatadas
const getCurrentDateTime = () => {
  const now = new Date();
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

  const time = now.toLocaleTimeString('pt-BR', timeOptions);
  const date = now.toLocaleDateString('pt-BR', dateOptions);

  return { time, date };
};

const HomeScreen = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(getCurrentDateTime().time);
  const [currentDate, setCurrentDate] = useState(getCurrentDateTime().date);

  const { theme, toggleTheme, isDark } = useContext(ThemeContext);

  const buttons = [
    { label: 'ProfessorIA (Chat)', screen: 'Chat', color: '#A1C4FC', iconText: '🤖' },
    { label: 'Meu Plano de Estudos', screen: 'Planning', color: '#FFF699', iconText: '🗓️' },
    { label: 'Desempenho e Métricas', screen: 'Metrics', color: '#B6EEA7', iconText: '📈' },
  ];

  useEffect(() => {
    const timerId = setInterval(() => {
      const { time, date } = getCurrentDateTime();
      setCurrentTime(time);
      setCurrentDate(date);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Botão para alternar tema */}
      <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
        <Text style={[styles.themeButtonText, { color: theme.buttonText }]}>🌓 Tema</Text>
      </TouchableOpacity>

      {/* Ícone principal */}
      <Image
        source={require('../assets/iconhead.png')}
        style={styles.headerIcon}
        resizeMode="contain"
      />

      {/* Título */}
      <Text style={[styles.header, { color: theme.text }]}>
        Bem-vindo ao seu Tutor de Matemática
      </Text>

      {/* RELÓGIO E DATA */}
      <View style={styles.dateTimeContainer}>
        <View style={[styles.dateTimeCard, { borderLeftColor: '#3B82F6', backgroundColor: theme.card }]}>
          <Text style={[styles.dateTimeLabel, { color: isDark ? '#CCC' : '#555' }]}>⌚ Hora Atual:</Text>
          <Text style={[styles.timeText, { color: isDark ? '#FFF' : '#111' }]}>{currentTime}</Text>
        </View>

        <View style={[styles.dateTimeCard, { borderLeftColor: '#10B981', backgroundColor: theme.card }]}>
          <Text style={[styles.dateTimeLabel, { color: isDark ? '#CCC' : '#555' }]}>📅 Data de Hoje:</Text>
          <Text style={[styles.dateText, { color: isDark ? '#FFF' : '#111' }]}>{currentDate}</Text>
        </View>
      </View>

      {/* Botões principais */}
      <View style={styles.buttonsContainer}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.screen}
            style={[styles.button, { backgroundColor: btn.color }]}
            onPress={() => navigation.navigate(btn.screen)}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#000' : '#000' }]}>
              {btn.iconText} {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  themeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'transparent',
    padding: 6,
    borderRadius: 8,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerIcon: {
    width: 120,
    height: 120,
    marginBottom: 15,
    marginTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  dateTimeCard: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 30,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default HomeScreen;