// PlanningScreen.js
import React, { useState, useRef, useContext } from 'react';
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
import { ThemeContext } from '../ThemeContext'; // Certifique-se do caminho correto
import iconHead from '../assets/iconhead.png'; // Caminho correto para assets

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- LÓGICA DA CHAMADA REAL À GEMINI API ---
const geminiApiCall = async (prompt) => {
    console.log("Chamando API Gemini com prompt:", prompt);

    const apiKey = "AIzaSyBLsSMLqMkX0wXODwsOheMl4jyEooqW2v8";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`; 

    const systemPrompt = "Você é um assistente de planejamento e cronograma de estudos voltados apenas a matemática, ciência de dados, inteligência artificial e programação. Sua única função é gerar um plano de estudos detalhado em formato JSON, baseado na requisição do usuário. Retorne o JSON diretamente, sem texto explicativo. Use sempre o idioma português.";

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
                if (status === 403) {
                    errorBody = "Erro 403: Chave da API Gemini inválida ou ausente.";
                }
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
    const { theme } = useContext(ThemeContext);

    const [messages, setMessages] = useState([
        { key: 'init', content: 'Olá! Diga-me o que você quer estudar ou planejar (ex: "estudar frações por 5 dias").', isUser: false }
    ]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
    };

    const handleScheduling = (plan) => {
        Alert.alert(
            "Agendamento de Tarefas",
            `O plano "${plan.planGoal}" com ${plan.tasks.length} tarefas pode ser adicionado manualmente ao Google Calendar.`
        );
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { text: input, isUser: true, key: String(Date.now()) };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setCurrentPlan(null);
        scrollToBottom();

        let aiMessageContent = null;
        try {
            const result = await geminiApiCall(userMessage.text);
            if (result.text) {
                let jsonText = result.text;
                if (jsonText.startsWith('```json')) {
                    jsonText = jsonText.replace(/```json|```/g, '');
                }
                const parsedPlan = JSON.parse(jsonText);
                setCurrentPlan(parsedPlan);
                return;
            } else if (result.error) {
                throw new Error(result.error.message);
            } else {
                aiMessageContent = "Resposta vazia da API.";
            }
        } catch (error) {
            aiMessageContent = `Erro ao gerar plano: ${error.message}`;
        } finally {
            setLoading(false);
            if (aiMessageContent) {
                setMessages(prev => [...prev, { content: aiMessageContent, isUser: false, key: String(Date.now() + 1) }]);
                scrollToBottom();
            }
        }
    };

    const renderItem = ({ item: msg }) => {
        const isUser = msg.isUser;
        return (
            <View
                key={msg.key}
                style={[styles.messageRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}
            >
                {!isUser && (
                    <Image source={iconHead} style={styles.aiIcon} />
                )}

                <View
                    style={[
                        styles.messageBubble,
                        {
                            maxWidth: '75%',
                            backgroundColor: isUser ? '#FFF699' : theme.card,
                            paddingVertical: isUser ? 12 : 20,
                            paddingHorizontal: isUser ? 12 : 20,
                        },
                    ]}
                >
                    <Text style={[styles.messageText, { color: isUser ? '#333' : theme.text, fontSize: !isUser ? 16 : 15 }]}>
                        {msg.text || msg.content}
                    </Text>
                </View>
            </View>
        );
    };

    const renderPlanView = () => {
        if (!currentPlan) return null;
        const plan = currentPlan;

        return (
            <ScrollView style={[styles.planViewContainer, { backgroundColor: theme.background }]} contentContainerStyle={styles.planContentContainer}>
                <Text style={[styles.mainTitle, { color: theme.text }]}>{plan.planGoal}</Text>

                <TouchableOpacity onPress={() => setCurrentPlan(null)} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: theme.primary }]}>← Iniciar Novo Plano</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>📊 Métricas do Plano</Text>
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

                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>🗓️ Cronograma Detalhado</Text>
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

                        const formatDate = (d) =>
                            d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

                        const gStart = formatDate(startDate);
                        const gEnd = formatDate(endDate);

                        const eventTitle = encodeURIComponent(task.topic);
                        const eventDetails = encodeURIComponent(task.activities);
                        const calendarLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${eventTitle}&dates=${gStart}/${gEnd}&details=${eventDetails}`;

                        return (
                            <View key={index} style={[styles.taskItemDetailed, { backgroundColor: theme.card }]}>
                                <View style={styles.taskHeader}>
                                    <Text style={[styles.taskDayDetail, { color: theme.textSecondary }]}>
                                        {task.day || `Dia ${index + 1}`} - {startDate.toLocaleDateString('pt-BR')}
                                    </Text>
                                    <View style={styles.timeSlotBadge}>
                                        <Text style={styles.timeSlotText}>
                                            {task.timeSlot || '20:00 - 21:00'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.taskTopicDetail, { color: theme.text }]}>{task.topic}</Text>
                                <Text style={[styles.taskActivities, { color: theme.textSecondary }]}>{task.activities}</Text>

                                <TouchableOpacity
                                    onPress={() => Linking.openURL(calendarLink)}
                                    style={styles.calendarLinkButton}
                                >
                                    <Text style={styles.calendarLinkText}>
                                        ➕ Adicionar ao Google Calendar
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <TouchableOpacity
                    onPress={() => handleScheduling(plan)}
                    style={styles.scheduleButtonDetailed}
                    accessible={true}
                    accessibilityLabel="Agendar todas as tarefas no calendário"
                >
                    <Text style={styles.scheduleButtonTextDetailed}>Agendar Todas no Calendário</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
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
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.textSecondary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Gerando plano...</Text>
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.textSecondary, backgroundColor: theme.background }]}
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
                            <ActivityIndicator size="small" color={theme.text} />
                        ) : (
                            <Text style={[styles.sendButtonText, { color: theme.text }]}>Gerar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    messageList: { flex: 1, padding: 10 },
    messageRow: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-start' },
    messageBubble: { borderRadius: 15 },
    messageText: { lineHeight: 22 },
    aiIcon: { width: 40, height: 40, marginRight: 10, borderRadius: 20 },
    inputArea: { borderTopWidth: 1, borderTopColor: '#E0E0E0' },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 5 },
    loadingText: { marginLeft: 8, fontSize: 13 },
    inputContainer: { flexDirection: 'row', padding: 10 },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 8,
        fontSize: 15,
    },
    sendButton: {
        backgroundColor: '#FDD835',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: { backgroundColor: '#CCC' },
    sendButtonText: { fontWeight: 'bold', fontSize: 15 },
    planViewContainer: { flex: 1 },
    planContentContainer: { padding: 20 },
    mainTitle: { fontSize: 24, fontWeight: 'bold', borderBottomWidth: 3, borderBottomColor: '#FDD835', paddingBottom: 5 },
    backButton: { marginBottom: 20, alignSelf: 'flex-start', paddingVertical: 5 },
    backButtonText: { fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 15, marginBottom: 10 },
    metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    metricCard: { flex: 1, padding: 15, borderRadius: 12, marginHorizontal: 5 },
    metricCardBlue: { backgroundColor: '#E3F2FD', borderLeftWidth: 4, borderLeftColor: '#2196F3' },
    metricCardGreen: { backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
    metricValue: { fontSize: 28, fontWeight: 'bold' },
    metricLabel: { fontSize: 13, marginTop: 5 },
    taskItemDetailed: { padding: 15, borderRadius: 10, marginBottom: 10 },
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    taskDayDetail: { fontSize: 15, fontWeight: '600' },
    timeSlotBadge: { backgroundColor: '#FFECB3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 15 },
    timeSlotText: { fontSize: 12, fontWeight: 'bold' },
    taskTopicDetail: { fontSize: 17, fontWeight: 'bold', marginBottom: 5 },
    taskActivities: { fontSize: 14, fontStyle: 'italic' },
    calendarLinkButton: { marginTop: 8, paddingVertical: 6 },
    calendarLinkText: { fontSize: 14, textDecorationLine: 'underline' },
    scheduleButtonDetailed: {
        backgroundColor: '#FDD835',
        padding: 15,
        borderRadius: 25,
        marginTop: 25,
        alignItems: 'center',
        elevation: 5,
    },
    scheduleButtonTextDetailed: { fontWeight: 'bold', fontSize: 16 },
});

export default PlanningScreen;