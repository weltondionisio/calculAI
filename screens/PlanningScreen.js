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
    ScrollView // Adicionado ScrollView para a visualização do plano
} from 'react-native';

// --- Placeholder para a Chamada Gemini API ---
// Substitua esta função pela sua lógica real de fetch para a API.
const geminiApiCall = async (prompt) => {
    console.log("Chamando API Gemini com prompt:", prompt);

    // Estrutura de retorno simulada para testar o parse JSON:
    const mockPlan = {
        planGoal: "Plano de Estudos para a Prova de Cálculo I",
        durationSummary: "3 dias",
        // totalTasks não é estritamente necessário no mock se contarmos tasks.length
        tasks: [
            {
                day: "Terça-feira",
                date: "10/10/2025",
                topic: "Derivadas e Limites",
                timeSlot: "19:00 - 21:00",
                activities: "Revisão teórica e 10 exercícios práticos do capítulo 3."
            },
            {
                day: "Quarta-feira",
                date: "11/10/2025",
                topic: "Integrais Indefinidas",
                timeSlot: "14:00 - 17:00",
                activities: "Resolver todos os exercícios ímpares do capítulo 4 do livro didático."
            },
            {
                day: "Quinta-feira",
                date: "12/10/2025",
                topic: "Revisão Geral e Simulado",
                timeSlot: "09:00 - 12:00",
                activities: "Fazer um simulado de prova de 3 horas. Corrigir erros à tarde."
            },
        ]
    };

    // Simula atraso da API
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    return {
        // O modelo deve retornar JSON encapsulado em fence blocks (```json ... ```)
        text: "```json\n" + JSON.stringify(mockPlan) + "\n```",
        error: null,
    };
};

const PlanningScreen = () => {
    const [messages, setMessages] = useState([
        { 
            key: 'init', 
            content: 'Olá! Diga-me o que você quer estudar ou planejar (ex: "estudar física moderna por 5 dias") para eu montar o cronograma.', 
            isUser: false 
        }
    ]);
    const [currentPlan, setCurrentPlan] = useState(null); // Estado para o plano estruturado
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    // Função para rolar a lista para o final
    const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    // Função placeholder para agendamento (usa Alert em RN)
    const handleScheduling = (plan) => {
        Alert.alert(
            "Agendamento de Tarefas",
            `O plano "${plan.planGoal}" com ${plan.tasks.length} tarefas seria agendado no seu calendário (funcionalidade a ser implementada).`
        );
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = {
            text: input,
            isUser: true,
            key: String(Date.now()),
        };

        // 1. Adiciona a mensagem do usuário, limpa o input e reseta o plano
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setCurrentPlan(null); 
        setTimeout(scrollToBottom, 50);

        let aiMessageContent;
        
        try {
            const result = await geminiApiCall(userMessage.text);
            
            if (result.text) { 
                let jsonText = result.text;
                // Regex para extrair o JSON de dentro dos fence blocks (```json ... ```)
                const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);

                if (jsonMatch && jsonMatch[1]) {
                    jsonText = jsonMatch[1].trim();
                } else {
                    jsonText = jsonText.trim(); 
                }

                try {
                    const parsedPlan = JSON.parse(jsonText);
                    // SUCESSO: Armazena o plano e sai da função
                    setCurrentPlan(parsedPlan); 
                    return; 

                } catch (parseError) {
                    console.error("Erro ao parsear JSON:", parseError);
                    const previewText = jsonText.substring(0, 300);
                    aiMessageContent = `❌ Erro de Formato JSON. O Gemini não retornou JSON válido. Texto Bruto: ${previewText}${jsonText.length > 300 ? '...' : ''}`;
                }

            } else if (result.error) {
                throw new Error(result.error.message);
            } else {
                aiMessageContent = "Desculpe, a resposta da API veio vazia.";
            }
            
        } catch (error) {
            console.error("Erro na Chamada Fetch/Gemini:", error);
            aiMessageContent = `🚨 Erro ao gerar plano: ${error.message}. Por favor, tente novamente.`; 
        } finally {
            setLoading(false); 

            // Adiciona a mensagem de ERRO ou VAZIA ao histórico de chat
            if (aiMessageContent) {
                const aiMessage = {
                    content: aiMessageContent, 
                    isUser: false,
                    key: String(Date.now() + 1),
                };
                setMessages(prev => [...prev, aiMessage]);
                setTimeout(scrollToBottom, 100); 
            }
        }
    };

    // Renderiza APENAS mensagens de texto simples (inicial ou erro)
    const renderMessageContent = (message) => {
        return <Text style={styles.messageText}>{message.content}</Text>;
    };

    // Renderiza o item da lista (apenas mensagens de texto)
    const renderItem = ({ item: msg }) => {
        // Ignora mensagens do assistente que possuem plano estruturado, pois a view principal as substitui
        if (!msg.isUser && typeof msg.content === 'object' && msg.content !== null) {
            return null;
        }

        return (
            <View
                key={msg.key}
                style={[
                    styles.messageBubble,
                    {
                        alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.isUser ? '#FFF699' : '#EEE', 
                    },
                ]}
            >
                <Text style={styles.messageText}>{msg.text || msg.content}</Text> 
            </View>
        );
    };

    // --- NOVO COMPONENTE DE VISUALIZAÇÃO DO PLANO ESTRUTURADO (MÉTRICAS E HORÁRIOS) ---
    const renderPlanView = () => {
        if (!currentPlan) return null;

        const plan = currentPlan;

        return (
            <ScrollView style={styles.planViewContainer} contentContainerStyle={styles.planContentContainer}>
                
                {/* TÍTULO PRINCIPAL */}
                <Text style={styles.mainTitle}>{plan.planGoal}</Text>
                
                {/* BOTÃO PARA VOLTAR AO CHAT / NOVO PLANO */}
                <TouchableOpacity onPress={() => setCurrentPlan(null)} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Iniciar Novo Plano</Text>
                </TouchableOpacity>

                {/* MÉTRICAS */}
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

                {/* HORÁRIOS / CALENDÁRIO (AGENDA) */}
                <Text style={styles.sectionTitle}>🗓️ Cronograma Detalhado</Text>
                <View style={styles.scheduleContainer}>
                    {plan.tasks.map((task, index) => (
                        <View key={index} style={styles.taskItemDetailed}>
                            <View style={styles.taskHeader}>
                                <Text style={styles.taskDayDetail}>
                                    {task.day}, {task.date}
                                </Text>
                                <View style={styles.timeSlotBadge}>
                                    <Text style={styles.timeSlotText}>
                                        {task.timeSlot}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.taskTopicDetail}>{task.topic}</Text>
                            <Text style={styles.taskActivities}>{task.activities}</Text>
                        </View>
                    ))}
                </View>

                {/* BOTÃO DE AÇÃO */}
                <TouchableOpacity
                    onPress={() => handleScheduling(plan)}
                    style={styles.scheduleButtonDetailed}
                    accessible={true}
                    accessibilityLabel="Agendar todas as tarefas no calendário"
                >
                    <Text style={styles.scheduleButtonTextDetailed}>Agendar Todas no Calendário</Text>
                </TouchableOpacity>
                
                {/* Espaço no final para evitar que o botão de agendar fique colado na borda */}
                <View style={{ height: 40 }} /> 
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            {/* CONTEÚDO PRINCIPAL: Plano estruturado ou Chat */}
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

            {/* INPUT E LOADING */}
            <View style={styles.inputArea}>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#333" />
                        <Text style={styles.loadingText}>Gerando plano...</Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder={currentPlan ? "Inicie um novo plano..." : "Liste os tópicos e a data de início..."}
                        editable={!loading}
                        onSubmitEditing={sendMessage} 
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} 
                        disabled={!input.trim() || loading} 
                        accessible={true}
                        accessibilityLabel="Gerar plano"
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
    
    // --- Estilos de Chat ---
    messageBubble: {
        maxWidth: '90%',
        padding: 12,
        borderRadius: 15,
        marginVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.41,
        elevation: 2,
    },
    messageText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    
    // --- Estilos de Input/Loading ---
    inputArea: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFF',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 15,
        paddingBottom: 5,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 8,
        backgroundColor: '#FFF',
    },
    sendButton: {
        backgroundColor: '#FDD835', 
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#CCC',
    },
    sendButtonText: {
        color: '#333',
        fontWeight: 'bold',
    },

    // --- Estilos da Visualização de Plano (Métricas + Cronograma) ---
    planViewContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    planContentContainer: {
        padding: 20,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        borderBottomWidth: 3,
        borderBottomColor: '#FDD835',
        paddingBottom: 5,
        marginBottom: 10,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
        paddingVertical: 5,
    },
    backButtonText: {
        color: '#007AFF', // Cor de link azul padrão
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        marginTop: 15,
        marginBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricCard: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.0,
        elevation: 1,
    },
    metricCardBlue: { backgroundColor: '#E3F2FD', borderLeftWidth: 4, borderLeftColor: '#2196F3' },
    metricCardGreen: { backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
    metricValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    metricLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 5,
    },
    scheduleContainer: {
        // FlatList já está sendo usado para o cronograma (tarefas)
    },
    taskItemDetailed: {
        backgroundColor: '#FAFAFA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#FDD835',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1.0,
        elevation: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    taskDayDetail: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    timeSlotBadge: {
        backgroundColor: '#FFECB3',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 15,
    },
    timeSlotText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    taskTopicDetail: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    taskActivities: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    scheduleButtonDetailed: {
        backgroundColor: '#FDD835', 
        padding: 15,
        borderRadius: 25,
        marginTop: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
    },
    scheduleButtonTextDetailed: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default PlanningScreen;