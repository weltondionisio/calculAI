import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MetricsScreen = () => {
    // --- Dados Mockados para Exemplo de Métricas (Substituir por dados reais do Firestore) ---
    const mockMetrics = {
        totalStudyHours: "48h 30m",
        plansCompleted: 7,
        completionRate: "85%",
        currentStreak: 12, // Dias seguidos estudando
    };

    const MetricCard = ({ title, value, unit, color }) => (
        <View style={[styles.card, { borderLeftColor: color }]}>
            <Text style={[styles.cardValue, { color }]}>{value}</Text>
            <Text style={styles.cardUnit}>{unit}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.headerTitle}>Seu Desempenho e Progresso</Text>
            <Text style={styles.headerSubtitle}>Acompanhe suas metas de planejamento e estudo.</Text>

            {/* Seção de Métricas Principais */}
            <View style={styles.metricsGrid}>
                <MetricCard 
                    title="Horas Totais de Estudo" 
                    value={mockMetrics.totalStudyHours} 
                    unit="Histórico" 
                    color="#007AFF" // Azul
                />
                <MetricCard 
                    title="Planos Concluídos" 
                    value={mockMetrics.plansCompleted} 
                    unit="Planos" 
                    color="#4CDA64" // Verde
                />
                <MetricCard 
                    title="Taxa de Conclusão" 
                    value={mockMetrics.completionRate} 
                    unit="Média Geral" 
                    color="#FF9500" // Laranja
                />
                <MetricCard 
                    title="Dias Seguidos" 
                    value={mockMetrics.currentStreak} 
                    unit="Dia(s)" 
                    color="#FF3B30" // Vermelho
                />
            </View>

            {/* Placeholder para Gráficos ou Histórico */}
            <View style={styles.placeholderSection}>
                <Text style={styles.sectionTitle}>Histórico de Progresso Mensal</Text>
                <View style={styles.chartPlaceholder}>
                    <Text style={styles.chartText}>Gráfico: Horas de Estudo vs. Dias (Em Implementação)</Text>
                </View>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    contentContainer: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
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
        borderLeftWidth: 5, // Destaque lateral
    },
    cardTitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    cardValue: {
        fontSize: 32,
        fontWeight: '900',
        lineHeight: 38,
    },
    cardUnit: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    placeholderSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    chartPlaceholder: {
        backgroundColor: '#E0E0E0',
        height: 200,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartText: {
        color: '#666',
        fontSize: 16,
    }
});

export default MetricsScreen;