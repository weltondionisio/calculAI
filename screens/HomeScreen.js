import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

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

    useEffect(() => {
        const timerId = setInterval(() => {
            const { time, date } = getCurrentDateTime();
            setCurrentTime(time);
            setCurrentDate(date);
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    const buttons = [
        { label: 'ProfessorIA (Chat)', screen: 'Chat', color: '#A1C4FC', iconText: '🤖' },
        { label: 'Meu Plano de Estudos', screen: 'Planning', color: '#FFF699', iconText: '🗓️' },
        { label: 'Desempenho e Métricas', screen: 'Metrics', color: '#B6EEA7', iconText: '📈' },
    ];

    return (
        <View style={styles.container}>
            {/* Ícone do cabeçalho */}
            <Image
                source={require('../assets/iconhead.png')}
                style={styles.headerIcon}
                resizeMode="contain"
            />

            <Text style={styles.header}>Bem-vindo ao seu Tutor de Matemática</Text>

            {/* RELÓGIO E DATA */}
            <View style={styles.dateTimeContainer}>
                <View style={[styles.dateTimeCard, { borderLeftColor: '#3B82F6' }]}>
                    <Text style={styles.dateTimeLabel}>⌚ Hora Atual:</Text>
                    <Text style={styles.timeText}>{currentTime}</Text>
                </View>

                <View style={[styles.dateTimeCard, { borderLeftColor: '#10B981' }]}>
                    <Text style={styles.dateTimeLabel}>📅 Data de Hoje:</Text>
                    <Text style={styles.dateText}>{currentDate}</Text>
                </View>
            </View>

            {/* Container de Botões */}
            <View style={styles.buttonsContainer}>
                {buttons.map((btn) => (
                    <TouchableOpacity
                        key={btn.screen}
                        style={[styles.button, { backgroundColor: btn.color }]}
                        onPress={() => navigation.navigate(btn.screen)}
                    >
                        <Text style={styles.buttonText}>{btn.iconText} {btn.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
    },
    headerIcon: {
        width: 120,
        height: 120,
        marginBottom: 15,
    },
    header: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 30,
        color: '#1F2937',
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
        backgroundColor: '#FFFFFF',
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
        color: '#6B7280',
        marginBottom: 4,
    },
    timeText: {
        fontSize: 30,
        fontWeight: '800',
        color: '#1F2937',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
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
        color: '#1F2937',
    }
});

export default HomeScreen;