import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';

// Definição do System Prompt para forçar a restrição
const SYSTEM_PROMPT = `
Você é o "CalculAI", um professor de matemática especializado em reforço escolar para o Ensino Médio. Sua única área de conhecimento é MATEMÁTICA. Recuse educadamente qualquer pergunta que não seja sobre Matemática. TODAS as expressões, equações e fórmulas devem ser formatadas usando sintaxe LaTeX, delimitada por '$'. O foco é sempre na explicação passo a passo (com $LaTeX$).
`;

// Chave fornecida pelo usuário como fallback (usada apenas se __api_key do ambiente falhar).
// NOTA: Esta chave foi verificada e inserida conforme o último valor fornecido.
const FALLBACK_API_KEY = "AIzaSyBLsSMLqMkX0wXODwsOheMl4jyEooqW2v8";

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

        // User messages are stored with the 'text' property
        const userMessage = { text: input, isUser: true, key: String(Date.now()) };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        // Tenta usar a chave de API injetada pelo ambiente (prioritário), caso contrário, usa a chave de fallback.
        const effectiveApiKey = (typeof __api_key !== 'undefined' && __api_key) ? __api_key : FALLBACK_API_KEY;

        if (!effectiveApiKey) { 
            Alert.alert("Erro de Chave", "A chave de API não está disponível. Não é possível enviar a mensagem.");
            setLoading(false); 
            return;
        }


        // CONFIGURAÇÃO DA CHAMADA FETCH (API REST)
        // CORREÇÃO: Usando o modelo mais recente e estável para melhor conectividade.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${effectiveApiKey}`;
        
        const payload = {
            // A mensagem do usuário
            contents: [{ role: "user", parts: [{ text: userMessage.text }] }],

            // O System Prompt é um campo de nível superior na API REST
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, 

            // Outras configurações da API
            generationConfig: { 
                maxOutputTokens: 512,
            },
        };

        try {
            // Chamada à API via fetch
            const apiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await apiResponse.json();

            // Verifica se a resposta contém texto
            let aiMessageText = "Desculpe, não consegui obter uma resposta.";
            if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
                aiMessageText = result.candidates[0].content.parts[0].text;
            } else if (result.error) {
                 // Captura erros de cota ou chave inválida
                aiMessageText = `Erro da API: ${result.error.message}`;
                console.error("Erro da API:", result.error);
            }
            
            const aiMessage = {
                text: aiMessageText,
                isUser: false,
                key: String(Date.now() + 1),
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Erro na Chamada Fetch/Gemini:", error);
            setMessages(prev => [...prev, { text: "Erro de conexão. Verifique sua chave de API e sua conexão de internet.", isUser: false, key: String(Date.now() + 2) }]);
        } finally {
            setLoading(false);
            setTimeout(scrollToBottom, 100); 
        }
    };

    const renderMessageContent = (message) => {
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
                    onSubmitEditing={sendMessage} // Permite enviar com a tecla Enter
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