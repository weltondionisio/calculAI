import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { GoogleGenerativeAI } from '@google/genai';

// Definição do System Prompt para forçar a restrição
const SYSTEM_PROMPT = `
Você é o "CalculAI", um professor de matemática especializado em reforço escolar para o Ensino Médio. Sua única área de conhecimento é MATEMÁTICA. Recuse educadamente qualquer pergunta que não seja sobre Matemática. TODAS as expressões, equações e fórmulas devem ser formatadas usando sintaxe LaTeX, delimitadas por '$'. O foco é sempre na explicação passo a passo (com $LaTeX$).
`;

// Substitua pela sua chave REAL
// IMPORTANTE: COLOQUE SUA CHAVE AQUI!
const API_KEY = "AIzaSyBLsSMLqMkX0wXODwsOheMl4jyEooqW2v8"; 

const ai = new GoogleGenerativeAI(API_KEY);
const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    config: {
        systemInstruction: SYSTEM_PROMPT,
        // Limitar respostas longas para agilizar o MVP
        maxOutputTokens: 512,
    },
});

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    // Adiciona uma mensagem de boas-vindas inicial
    useEffect(() => {
        setMessages([
            { 
                text: "Olá! Eu sou o CalculAI, seu professor particular de Matemática do Ensino Médio. Como posso te ajudar hoje?", 
                isUser: false, 
                key: 'welcome' 
            }
        ]);
    }, []);

    // Função para rolar a lista para o final
    const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        if (API_KEY === "SUA_CHAVE_GEMINI_AQUI" || !API_KEY) {
            Alert.alert("Erro de API", "Por favor, substitua 'SUA_CHAVE_GEMINI_AQUI' pela sua chave de API real no ChatScreen.js.");
            return;
        }

        const userMessage = { text: input, isUser: true, key: String(Date.now()) };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Chamada à API
            const response = await model.generateContent(input);
            const aiMessageText = response.text;

            const aiMessage = {
                text: aiMessageText,
                isUser: false,
                key: String(Date.now() + 1),
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Erro na API do Gemini:", error);
            setMessages(prev => [...prev, { text: "Desculpe, houve um erro ao processar sua solicitação. Verifique sua chave de API e sua conexão.", isUser: false, key: String(Date.now() + 2) }]);
        } finally {
            setLoading(false);
            // Pequeno atraso para garantir que a FlatList seja atualizada antes da rolagem
            setTimeout(scrollToBottom, 100); 
        }
    };

    // FUNÇÃO DE RENDERIZAÇÃO CORRIGIDA: AGORA SÓ USA <Text>
    const renderMessageContent = (message) => {
        // Renderiza a mensagem, incluindo o LaTeX como texto simples (string)
        return <Text style={styles.messageText}>{message.text}</Text>;
    };

    const renderItem = ({ item: msg }) => (
        <View
            key={msg.key}
            style={[
                styles.messageBubble,
                {
                    alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.isUser ? '#A1C4FC' : '#EEE',
                },
            ]}
        >
            {renderMessageContent(msg)}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.key}
                style={styles.messageList}
                // Garante que a rolagem aconteça após o envio de uma nova mensagem
                onContentSizeChange={scrollToBottom} 
            />
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#A1C4FC" />
                    <Text style={styles.loadingText}>Calculando...</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Pergunte algo de Matemática..."
                    editable={!loading}
                />
                <TouchableOpacity
                    onPress={sendMessage}
                    style={styles.sendButton}
                    disabled={!input.trim() || loading}
                    accessible={true}
                    accessibilityLabel="Enviar mensagem"
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.sendButtonText}>Enviar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    messageList: { flex: 1, padding: 10 },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 15,
        marginVertical: 4,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 15,
        marginBottom: 5,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#DDD',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#A1C4FC',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: '#A1C4FC',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default ChatScreen;