import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, 
    Alert, ScrollView, StyleSheet, Image, Linking 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../ThemeContext';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// === Função Gemini ===
const geminiApiCall = async (prompt) => {
    const apiKey = "AIzaSyBLsSMLqMkX0wXODwsOheMl4jyEooqW2v8";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`; 

    const systemPrompt = "Você é um assistente de planejamento e cronograma de estudos. Sua função é gerar planos de estudo em JSON. Retorne somente JSON.";

    const responseSchema = {
        type: "OBJECT",
        properties: {
            planGoal: { type: "STRING" },
            durationSummary: { type: "STRING" },
            tasks: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        day: { type: "STRING" },
                        date: { type: "STRING" },
                        topic: { type: "STRING" },
                        timeSlot: { type: "STRING" },
                        activities: { type: "STRING" }
                    },
                    required: ["day", "date", "topic", "timeSlot", "activities"]
                }
            }
        },
        required: ["planGoal", "durationSummary", "tasks"]
    };

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    };

    const maxRetries = 3;
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const status = response.status;
                let errorBody = await response.text();
                throw new Error(`API Error: ${status} - ${errorBody}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Resposta vazia da API Gemini.");
            return { text, error: null };

        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) await sleep(Math.pow(2, i) * 1000);
        }
    }
    return { text: null, error: lastError };
};

// === COMPONENTE PRINCIPAL ===
const PlanningScreen = () => {
    const { theme, isDark } = useContext(ThemeContext);
    const [messages, setMessages] = useState([{ key: 'init', content: 'Olá! Diga-me o que você quer estudar.', isUser: false }]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [activePlans, setActivePlans] = useState([]);
    const flatListRef = useRef(null);

    useEffect(() => { loadActivePlans(); }, []);

    const scrollToBottom = () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    const loadActivePlans = async () => {
        try {
            const storedPlans = await AsyncStorage.getItem('@activePlans');
            setActivePlans(storedPlans ? JSON.parse(storedPlans) : []);
        } catch (error) { console.error('Erro ao carregar planos ativos:', error); }
    };

    const saveActivePlans = async (plans) => {
        setActivePlans(plans);
        await AsyncStorage.setItem('@activePlans', JSON.stringify(plans));
    };

    const markPlanCompleted = async (plan) => {
        try {
            const remainingPlans = activePlans.filter(p => p.planGoal !== plan.planGoal);
            setActivePlans(remainingPlans);
            await AsyncStorage.setItem('@activePlans', JSON.stringify(remainingPlans));

            const completedJSON = await AsyncStorage.getItem('@completedPlans');
            const completedPlans = completedJSON ? JSON.parse(completedJSON) : [];
            await AsyncStorage.setItem('@completedPlans', JSON.stringify([
                ...completedPlans,
                { ...plan, completed: true, completedAt: new Date().toISOString() }
            ]));

            setCurrentPlan(null);
            Alert.alert("Parabéns!", `Plano "${plan.planGoal}" concluído e registrado nas métricas.`);
        } catch (error) { console.error('Erro ao marcar plano completo:', error); }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMessage = { text: input, isUser: true, key: String(Date.now()) };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setCurrentPlan(null);
        scrollToBottom();

        try {
            const result = await geminiApiCall(userMessage.text);
            let jsonText = result.text;
            if (jsonText.startsWith('```json')) jsonText = jsonText.replace(/```json|```/g, '');
            const parsedPlan = JSON.parse(jsonText);

            const newActivePlans = [...activePlans, parsedPlan];
            setActivePlans(newActivePlans);
            await AsyncStorage.setItem('@activePlans', JSON.stringify(newActivePlans));
            setCurrentPlan(parsedPlan);

        } catch (error) {
            setMessages(prev => [...prev, { content: `Erro: ${error.message}`, isUser: false, key: String(Date.now() + 1) }]);
        } finally { setLoading(false); }
    };

    // === ENVIA TAREFAS PARA MÉTRICAS ===
    const sendTasksToMetrics = async (plan) => {
        try {
            const json = await AsyncStorage.getItem('@todoTasks');
            const existingTasks = json ? JSON.parse(json) : [];

            const historicalJson = await AsyncStorage.getItem('@historicalTasks');
            const historicalTasks = historicalJson ? JSON.parse(historicalJson) : [];

            const tasksToAdd = plan.tasks.map((task, index) => {
                let hours = 1;
                if (task.timeSlot) {
                    const match = task.timeSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
                    if (match) {
                        const startHour = parseInt(match[1], 10);
                        const startMin = parseInt(match[2], 10);
                        const endHour = parseInt(match[3], 10);
                        const endMin = parseInt(match[4], 10);
                        hours = (endHour + endMin/60) - (startHour + startMin/60);
                    }
                }
                const taskObj = {
                    id: Date.now().toString() + index,
                    text: task.topic,
                    hours: Number(hours.toFixed(1)),
                    completed: false,
                    date: new Date().toISOString(),
                };
                historicalTasks.push({ ...taskObj, sentFromPlan: true });
                return taskObj;
            });

            const newTasks = [...tasksToAdd, ...existingTasks];
            await AsyncStorage.setItem('@todoTasks', JSON.stringify(newTasks));
            await AsyncStorage.setItem('@historicalTasks', JSON.stringify(historicalTasks));

            Alert.alert('Sucesso', `Todas as tarefas do plano "${plan.planGoal}" foram enviadas para a Lista de tarefas.`);

        } catch (error) {
            console.error('Erro ao enviar tarefas:', error);
            Alert.alert('Erro', 'Não foi possível enviar as tarefas.');
        }
    };

    // === MENSAGENS ===
    const renderItem = ({ item: msg }) => (
        <View
            style={[
                styles.messageBubble,
                {
                    alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.isUser
                        ? (isDark ? '#FBC02D' : '#FFF799')
                        : (isDark ? '#444' : '#EEE')
                }
            ]}
        >
            <Text style={[styles.messageText, { color: isDark ? '#FFF' : '#333' }]}>
                {msg.text || msg.content}
            </Text>
        </View>
    );

    // === RENDERIZA PLANO ===
    const renderPlanView = () => {
        if (!currentPlan) return null;
        const plan = currentPlan;
        return (
            <ScrollView style={[styles.planViewContainer, { backgroundColor: theme.background }]} contentContainerStyle={styles.planContentContainer}>
                <Text style={[styles.mainTitle, { color: theme.text }]}>{plan.planGoal}</Text>
                <TouchableOpacity onPress={() => setCurrentPlan(null)} style={styles.backButton}>
                    <Text style={{ color: theme.link }}>← Iniciar Novo Plano</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Métricas do Plano</Text>
                <View style={styles.metricsContainer}>
                    <View style={[styles.metricCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
                        <Text style={[styles.metricValue, { color: theme.text }]}>{plan.tasks.length}</Text>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total de Tarefas</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: isDark ? '#1B5E20' : '#E8F5E9' }]}>
                        <Text style={[styles.metricValue, { color: theme.text }]}>{plan.durationSummary}</Text>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Duração Estimada</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>🗓️ Cronograma Detalhado</Text>

                {plan.tasks.map((task, index) => (
                    <View key={index} style={[styles.taskItemDetailed, { backgroundColor: isDark ? '#333' : '#FAFAFA' }]}>
                        <Text style={[styles.taskTopicDetail, { color: theme.text }]}>{task.topic}</Text>
                        <Text style={[styles.taskActivities, { color: theme.textSecondary }]}>{task.activities}</Text>
                    </View>
                ))}

                <TouchableOpacity onPress={() => sendTasksToMetrics(plan)} style={[styles.scheduleButtonDetailed, { backgroundColor: '#4CAF50' }]}>
                    <Text style={[styles.scheduleButtonTextDetailed, { color: '#FFF' }]}>📥 Enviar para a lista</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => markPlanCompleted(plan)} style={[styles.scheduleButtonDetailed, { backgroundColor: '#FFD54F' }]}>
                    <Text style={styles.scheduleButtonTextDetailed}>✅ Marcar como Concluído</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {currentPlan ? (
                renderPlanView()
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.key}
                    style={styles.messageList}
                    onContentSizeChange={scrollToBottom}
                />
            )}

            <View style={[styles.inputArea, { backgroundColor: theme.card }]}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Ex: Equações de 1º grau em 10 dias"
                        placeholderTextColor={theme.textSecondary}
                        editable={!loading}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
                        disabled={!input.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#333" />
                        ) : (
                            <Text style={styles.sendButtonText}>Gerar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// === ESTILOS BÁSICOS ===
const styles = StyleSheet.create({
    container: { flex: 1 },
    messageList: { flex: 1, padding: 10 },
    messageBubble: { maxWidth: '90%', padding: 12, borderRadius: 15, marginVertical: 4 },
    messageText: { fontSize: 15, lineHeight: 22 },
    inputArea: { borderTopWidth: 1 },
    inputContainer: { flexDirection: 'row', padding: 10 },
    input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 8, fontSize: 15 },
    sendButton: { backgroundColor: '#FDD835', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
    sendButtonDisabled: { backgroundColor: '#CCC' },
    sendButtonText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
    planViewContainer: { flex: 1 },
    planContentContainer: { padding: 20 },
    mainTitle: { fontSize: 24, fontWeight: 'bold', borderBottomWidth: 3, borderBottomColor: '#FDD835', paddingBottom: 5 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 15, marginBottom: 10 },
    metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    metricCard: { flex: 1, padding: 15, borderRadius: 12, marginHorizontal: 5 },
    metricValue: { fontSize: 28, fontWeight: 'bold' },
    metricLabel: { fontSize: 13 },
    taskItemDetailed: { padding: 15, borderRadius: 10, marginBottom: 10 },
    taskTopicDetail: { fontSize: 17, fontWeight: 'bold', marginBottom: 5 },
    taskActivities: { fontSize: 14, fontStyle: 'italic' },
    scheduleButtonDetailed: { borderRadius: 20, padding: 12, marginTop: 15, alignItems: 'center' },
    scheduleButtonTextDetailed: { fontSize: 16, fontWeight: 'bold' }
});

export default PlanningScreen;