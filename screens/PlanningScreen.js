import React, { useState, useRef, useEffect } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    ActivityIndicator,
    Alert,
    ScrollView,
    Linking,
    Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

const PlanningScreen = () => {
    const [messages, setMessages] = useState([
        { key: 'init', content: 'Olá! Diga-me o que você quer estudar.', isUser: false }
    ]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [activePlans, setActivePlans] = useState([]);
    const flatListRef = useRef(null);

    useEffect(() => { loadActivePlans(); }, []);

    const scrollToBottom = () => { setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50); };

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
            console.error('Erro ao enviar tarefas para MetricsScreen:', error);
            Alert.alert('Erro', 'Não foi possível enviar as tarefas.');
        }
    };

    const renderItem = ({ item: msg }) => {
        // Mensagem inicial com ícone
        if (!msg.isUser && msg.key === 'init') {
            return (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                    <Image
                        source={require('../assets/iconhead.png')}
                        style={{ width: 50, height: 50, marginRight: 10, borderRadius: 25 }}
                        resizeMode="contain"
                    />
                    <View style={{ flexShrink: 1, backgroundColor: '#EEE', borderRadius: 15, padding: 10 }}>
                        <Text style={{ fontSize: 15, color: '#333', lineHeight: 22 }}>
                            {msg.content}
                        </Text>
                    </View>
                </View>
            );
        }

        // Outras mensagens
        return (
            <View
                key={msg.key}
                style={[
                    styles.messageBubble,
                    { alignSelf: msg.isUser ? 'flex-end' : 'flex-start', backgroundColor: msg.isUser ? '#FFF699' : '#EEE' }
                ]}
            >
                <Text style={styles.messageText}>{msg.text || msg.content}</Text>
            </View>
        );
    };

    const renderPlanView = () => {
        if (!currentPlan) return null;
        const plan = currentPlan;

        return (
            <ScrollView style={styles.planViewContainer} contentContainerStyle={styles.planContentContainer}>
                <Text style={styles.mainTitle}>{plan.planGoal}</Text>
                <TouchableOpacity onPress={() => setCurrentPlan(null)} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Iniciar Novo Plano</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>📊 Métricas do Plano</Text>
                <View style={styles.metricsContainer}>
                    <View style={[styles.metricCard, styles.metricCardBlue]}>
                        <Text style={styles.metricValue}>{plan.tasks.length}</Text>
                        <Text style={styles.metricLabel}>Total de Tarefas</Text>
                    </View>
                    <View style={[styles.metricCard, styles.metricCardGreen]}>
                        <Text style={styles.metricValue}>{plan.durationSummary}</Text>
                        <Text style={styles.metricLabel}>Duração Estimada</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>🗓️ Cronograma Detalhado</Text>
                <View style={styles.scheduleContainer}>
                    {plan.tasks.map((task, index) => {
                        const startDate = new Date();
                        startDate.setDate(startDate.getDate() + index);
                        let startHour = 20, startMin = 0;
                        const match = task.timeSlot?.match(/(\d{1,2})[:h](\d{2})?/);
                        if (match) {
                            startHour = parseInt(match[1], 10);
                            startMin = parseInt(match[2] || '00', 10);
                        }
                        startDate.setHours(startHour, startMin, 0, 0);
                        const endDate = new Date(startDate);
                        endDate.setHours(startDate.getHours() + 1);

                        const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

                        const gStart = formatDate(startDate);
                        const gEnd = formatDate(endDate);

                        const eventTitle = encodeURIComponent(task.topic);
                        const eventDetails = encodeURIComponent(task.activities);
                        const calendarLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${eventTitle}&dates=${gStart}/${gEnd}&details=${eventDetails}`;

                        return (
                            <View key={index} style={styles.taskItemDetailed}>
                                <View style={styles.taskHeader}>
                                    <Text style={styles.taskDayDetail}>
                                        {task.day || `Dia ${index + 1}`} - {startDate.toLocaleDateString('pt-BR')}
                                    </Text>
                                    <View style={styles.timeSlotBadge}>
                                        <Text style={styles.timeSlotText}>{task.timeSlot || '20:00 - 21:00'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.taskTopicDetail}>{task.topic}</Text>
                                <Text style={styles.taskActivities}>{task.activities}</Text>

                                <TouchableOpacity
                                    onPress={() => Linking.openURL(calendarLink)}
                                    style={styles.calendarLinkButton}
                                >
                                    <Text style={styles.calendarLinkText}>➕ Adicionar ao Google Calendar</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <TouchableOpacity
                    onPress={() => sendTasksToMetrics(plan)}
                    style={[styles.scheduleButtonDetailed, { backgroundColor: '#4CAF50' }]}
                    accessible={true}
                    accessibilityLabel="Enviar tarefas para Todo List"
                >
                    <Text style={[styles.scheduleButtonTextDetailed, { color: '#FFF' }]}>📥 Enviar para a lista de tarefas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => markPlanCompleted(plan)}
                    style={styles.scheduleButtonDetailed}
                    accessible={true}
                    accessibilityLabel="Marcar plano como concluído"
                >
                    <Text style={styles.scheduleButtonTextDetailed}>✅ Marcar como Concluído</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
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

            <View style={styles.inputArea}>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#666" />
                        <Text style={styles.loadingText}>Gerando plano...</Text>
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Ex: Equações de 1º grau em 10 dias"
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    messageList: { flex: 1, padding: 10 },
    messageBubble: { maxWidth: '90%', padding: 12, borderRadius: 15, marginVertical: 4 },
    messageText: { fontSize: 15, color: '#333', lineHeight: 22 },
    inputArea: { borderTopWidth: 1, borderTopColor: '#E0E0E0', backgroundColor: '#FFF' },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 5 },
    loadingText: { marginLeft: 8, color: '#666', fontSize: 13 },
    inputContainer: { flexDirection: 'row', padding: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 8, backgroundColor: '#FFF', fontSize: 15 },
    sendButton: { backgroundColor: '#FDD835', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
    sendButtonDisabled: { backgroundColor: '#CCC' },
    sendButtonText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
    planViewContainer: { flex: 1, backgroundColor: '#FFF' },
    planContentContainer: { padding: 20 },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', borderBottomWidth: 3, borderBottomColor: '#FDD835', paddingBottom: 5 },
    backButton: { marginBottom: 20, alignSelf: 'flex-start', paddingVertical: 5 },
    backButtonText: { color: '#007AFF', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#555', marginTop: 15, marginBottom: 10 },
    metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    metricCard: { flex: 1, padding: 15, borderRadius: 12, marginHorizontal: 5 },
    metricCardBlue: { backgroundColor: '#E3F2FD', borderLeftWidth: 4, borderLeftColor: '#2196F3' },
    metricCardGreen: { backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
    metricValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    metricLabel: { fontSize: 13, color: '#666', marginTop: 5 },
    taskItemDetailed: { backgroundColor: '#FAFAFA', padding: 15, borderRadius: 10, marginBottom: 10 },
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    taskDayDetail: { fontSize: 15, fontWeight: '600', color: '#555' },
    timeSlotBadge: { backgroundColor: '#FFECB3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 15 },
    timeSlotText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    taskTopicDetail: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    taskActivities: { fontSize: 14, color: '#666', fontStyle: 'italic' },
    calendarLinkButton: { marginTop: 5 },
    calendarLinkText: { color: '#007AFF', fontSize: 14 },
    scheduleButtonDetailed: { backgroundColor: '#FFD54F', borderRadius: 20, padding: 12, marginTop: 15, alignItems: 'center' },
    scheduleButtonTextDetailed: { fontSize: 16, fontWeight: 'bold' }
});

export default PlanningScreen;