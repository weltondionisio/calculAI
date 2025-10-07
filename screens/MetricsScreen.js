import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MetricsScreen = () => {
    const [metrics, setMetrics] = useState({
        totalStudyHours: 0,
        avgStudyHoursPerDay: 0,
        plansCompleted: 0,
        completionRate: 0,
        currentStreak: 0,
        dailyProgress: [], // [{ date: '2025-10-07', hours: 2 }]
    });

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            const completedJSON = await AsyncStorage.getItem('@completedPlans');
            const completedPlans = completedJSON ? JSON.parse(completedJSON) : [];

            const activeJSON = await AsyncStorage.getItem('@activePlans');
            const activePlans = activeJSON ? JSON.parse(activeJSON) : [];

            // --- Total de horas de estudo ---
            let totalHours = 0;
            let dayMap = {}; // dias distintos e horas por dia
            completedPlans.forEach(plan => {
                plan.tasks.forEach(task => {
                    let hours = 1; // Considerando 1h por tarefa
                    totalHours += hours;

                    const date = task.date ? new Date(task.date).toDateString() : new Date().toDateString();
                    dayMap[date] = (dayMap[date] || 0) + hours;
                });
            });

            // --- Média de estudo por dia ---
            const daysStudied = Object.keys(dayMap).length;
            const avgPerDay = daysStudied ? totalHours / daysStudied : 0;

            // --- Dias seguidos (streak) ---
            const sortedDays = Object.keys(dayMap).sort((a,b) => new Date(a) - new Date(b));
            let streak = 0;
            if (sortedDays.length > 0) {
                let lastDate = new Date(sortedDays[0]);
                streak = 1;
                for (let i=1; i<sortedDays.length; i++) {
                    const currentDate = new Date(sortedDays[i]);
                    const diff = (currentDate - lastDate) / (1000*60*60*24);
                    if (diff === 1) streak++;
                    else streak = 1;
                    lastDate = currentDate;
                }
            }

            // --- Taxa de conclusão ---
            const totalPlans = completedPlans.length + activePlans.length;
            const completionRate = totalPlans ? Math.round((completedPlans.length / totalPlans) * 100) : 0;

            // --- Formata dailyProgress para gráfico ---
            const dailyProgress = Object.keys(dayMap).map(date => ({
                date,
                hours: dayMap[date]
            })).sort((a,b) => new Date(a.date) - new Date(b.date));

            setMetrics({
                totalStudyHours: totalHours,
                avgStudyHoursPerDay: avgPerDay.toFixed(1),
                plansCompleted: completedPlans.length,
                completionRate,
                currentStreak: streak,
                dailyProgress
            });

        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
        }
    };

    const MetricCard = ({ title, value, unit, color }) => (
        <View style={[styles.card, { borderLeftColor: color }]}>
            <Text style={[styles.cardValue, { color }]}>{value}</Text>
            <Text style={styles.cardUnit}>{unit}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
    );

    const renderDailyProgressItem = ({ item }) => (
        <View style={styles.progressItem}>
            <Text style={styles.progressDate}>{item.date}</Text>
            <View style={[styles.progressBar, { width: Math.min(item.hours*20, 200) }]} />
            <Text style={styles.progressHours}>{item.hours}h</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.headerTitle}>Seu Desempenho e Progresso</Text>
            <Text style={styles.headerSubtitle}>Acompanhe suas metas de planejamento e estudo.</Text>

            <View style={styles.metricsGrid}>
                <MetricCard title="Horas Totais de Estudo" value={metrics.totalStudyHours} unit="h" color="#007AFF" />
                <MetricCard title="Média por Dia" value={metrics.avgStudyHoursPerDay} unit="h/dia" color="#4CDA64" />
                <MetricCard title="Planos Concluídos" value={metrics.plansCompleted} unit="planos" color="#FF9500" />
                <MetricCard title="Dias Seguidos" value={metrics.currentStreak} unit="dias" color="#FF3B30" />
            </View>

            <Text style={styles.sectionTitle}>📅 Histórico Diário de Estudo</Text>
            {metrics.dailyProgress.length === 0 ? (
                <Text style={{ color: '#666', marginBottom: 20 }}>Nenhum estudo registrado ainda.</Text>
            ) : (
                <FlatList
                    data={metrics.dailyProgress}
                    keyExtractor={item => item.date}
                    renderItem={renderDailyProgressItem}
                />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
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
    cardValue: { fontSize: 32, fontWeight: '900', lineHeight: 38 },
    cardUnit: { fontSize: 14, fontWeight: '600', color: '#555' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    progressItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    progressDate: { width: 100, fontSize: 14, color: '#555' },
    progressBar: { height: 12, backgroundColor: '#007AFF', borderRadius: 6, marginRight: 10 },
    progressHours: { fontSize: 14, color: '#333' },
});

export default MetricsScreen;