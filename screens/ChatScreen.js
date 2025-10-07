import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import MathView from 'react-native-math-view';

const SYSTEM_PROMPT = `Você é o "CalculAI", um professor de matemática e ciências exatas, capaz de auxiliar em qualquer nível de ensino, desde Ensino Médio até universitário, incluindo tópicos avançados como Estatística, Probabilidade, Álgebra Linear, Cálculo e Data Science. Todas as expressões, equações e fórmulas devem ser formatadas usando sintaxe LaTeX, delimitada por '$' ou '$$'. Explique sempre passo a passo e de forma didática, adaptando o nível do conteúdo ao conhecimento do usuário. Recuse educadamente perguntas que não estejam relacionadas a matemática ou ciências exatas.`;

const API_KEY = 'AIzaSyBLsSMLqMkX0wXODwsOheMl4jyEooqW2v8';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    setMessages([{ text: "Olá! Como posso te ajudar a estudar? - Dr. Rob. Otto", isUser: false, key: 'welcome' }]);
  }, []);

  const scrollToBottom = () => flatListRef.current?.scrollToEnd({ animated: true });

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, isUser: true, key: String(Date.now()) };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage.text }] }],
      generationConfig: { maxOutputTokens: 512 },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      let aiText = "Desculpe, não consegui obter uma resposta.";

      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiText = result.candidates[0].content.parts[0].text;
      } else if (result.error) {
        console.error('Erro da API:', result.error);
        aiText = `Erro da API: ${result.error.message}`;
      }

      const aiMessage = { text: aiText, isUser: false, key: String(Date.now() + 1) };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Erro na chamada Fetch/Gemini:', error);
      setMessages(prev => [...prev, { text: 'Erro de conexão. Verifique sua chave de API e a internet.', isUser: false, key: String(Date.now() + 2) }]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const renderMessageContent = (message) => {
    if (!message.isUser) {
      // Separar texto normal e LaTeX delimitado por $$
      const parts = message.text.split(/(\$\$.*?\$\$)/g).filter(Boolean);

      return (
        <View style={styles.aiMessageContainer}>
          <Image source={require('../assets/iconhead.png')} style={styles.aiIcon} resizeMode="contain" />
          <View style={{ flexShrink: 1 }}>
            {parts.map((part, idx) => {
              if (part.startsWith('$$') && part.endsWith('$$')) {
                const latex = part.slice(2, -2); // remove $$ 
                return <MathView key={idx} math={latex} style={{ marginVertical: 4 }} />;
              }
              return <Text key={idx} style={styles.messageText}>{part}</Text>;
            })}
          </View>
        </View>
      );
    }

    return <Text style={styles.messageText}>{message.text}</Text>;
  };

  const renderItem = ({ item }) => (
    <View key={item.key} style={[styles.messageBubble, { alignSelf: item.isUser ? 'flex-end' : 'flex-start', backgroundColor: item.isUser ? '#A1C4FC' : '#EEE' }]}>
      {renderMessageContent(item)}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.key}
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
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={!input.trim() || loading}>
          {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.sendButtonText}>Enviar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  messageList: { flex: 1, padding: 10 },
  messageBubble: { maxWidth: '90%', padding: 12, borderRadius: 15, marginVertical: 4 },
  aiMessageContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  aiIcon: { width: 32, height: 32, marginRight: 8, borderRadius: 16 },
  messageText: { fontSize: 16, color: '#333', flexShrink: 1 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 5 },
  loadingText: { marginLeft: 8, color: '#666' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#DDD' },
  input: { flex: 1, borderWidth: 1, borderColor: '#A1C4FC', borderRadius: 25, paddingHorizontal: 18, paddingVertical: 12, marginRight: 8 },
  sendButton: { backgroundColor: '#A1C4FC', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'center' },
  sendButtonText: { color: 'white', fontWeight: 'bold' }
});

export default ChatScreen;