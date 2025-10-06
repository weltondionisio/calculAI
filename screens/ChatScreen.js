import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { GoogleGenerativeAI } from '@google/genai';
import MathView from 'react-native-math-view'; // Renderiza LaTeX

// Definição do System Prompt para forçar a restrição
const SYSTEM_PROMPT = `
Você é o "CalculAI", um professor de matemática especializado em reforço escolar para o Ensino Médio. Sua única área de conhecimento é MATEMÁTICA. Recuse educadamente qualquer pergunta que não seja sobre Matemática. TODAS as expressões, equações e fórmulas devem ser formatadas usando sintaxe LaTeX, delimitadas por '$'. O foco é sempre na explicação passo a passo (com $LaTeX$).
`;

// Substitua pela sua chave REAL
const API_KEY = "SUA_CHAVE_GEMINI_AQUI";

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

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { text: input, isUser: true, key: String(Date.now()) }; // Add key for FlatList
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Chamada à API
            const response = await model.generateContent(input);
            const aiMessageText = response.text();

            // Simplesmente divide a mensagem por $ para identificar blocos de texto vs. LaTeX
            const parts = aiMessageText.split('$');
            const aiMessage = {
                text: aiMessageText,
                isUser: false,
                parts: parts,
                key: String(Date.now() + 1), // Add key for FlatList
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Erro na API do Gemini:", error);
            setMessages(prev => [...prev, { text: "Desculpe, houve um erro ao processar sua solicitação.", isUser: false, key: String(Date.now() + 2) }]); // Add key for FlatList
        } finally {
            setLoading(false);
        }
    };

    const renderMessageContent = (message) => {
        // Renderiza cada parte da mensagem, separando o texto comum do LaTeX
        if (message.isUser) {
            return <Text style={styles.messageText}>{message.text}</Text>;
        }

        return message.parts.map((part, index) => {
            // Se for um índice ímpar, é uma fórmula em LaTeX
            if (index % 2 !== 0) {
                // MathView precisa de um string de LaTeX válido
                return (
                    <MathView
                        key={index}
                        config={{ exSize: 15 }}
                        math={part}
                        style={styles.mathView}
                    />
                );
            }
            // Se for par, é texto comum
            if (part) {
                return <Text key={index} style={styles.messageText}>{part}</Text>;
            }
            return null;
        });
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={({ item: msg }) => (
                    <View
                        key={msg.key}
                        style={[
                            styles.messageBubble,
                            {
                                alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                                backgroundColor: msg.isUser ? '#A1C4FC' : '#EEE', // Azul para usuário
                            },
                        ]}
                    >
                        {renderMessageContent(msg)}
                    </View>
                )}
                keyExtractor={(item) => item.key}
                style={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

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
        fontFamily: 'sans-serif-light', // Fonte simples e arredondada
    },
    mathView: {
        marginVertical: 5,
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