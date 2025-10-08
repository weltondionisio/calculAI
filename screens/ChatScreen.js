import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const SYSTEM_PROMPT = `Você é o "CalculAI", um professor de matemática e ciências exatas, capaz de auxiliar em qualquer nível de ensino, desde Ensino Médio até universitário, incluindo tópicos avançados como Estatística, Probabilidade, Álgebra Linear, Cálculo e Data Science. Todas as expressões, equações e fórmulas devem ser formatadas usando sintaxe LaTeX, delimitada por '$' ou '$$'. Explique sempre passo a passo e de forma didática, adaptando o nível do conteúdo ao conhecimento do usuário. Recuse educadamente perguntas que não estejam relacionadas a matemática ou ciências exatas.`;

const API_KEY = 'AIzaSyBLsSMLqMkX0wXODwsOheMl4jyEooqW2v8';
const screenWidth = Dimensions.get('window').width;

const LaTeXBlock = ({ latex }) => {
  const [webHeight, setWebHeight] = useState(40);

  const html = `
    <html>
      <head>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js"></script>
        <style>body{margin:0;padding:0;font-size:16px;}</style>
      </head>
      <body>
        <div id="math">\\(${latex}\\)</div>
        <script>
          window.onload = function() {
            const height = document.getElementById('math').offsetHeight;
            window.ReactNativeWebView.postMessage(height.toString());
          };
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={{ width: screenWidth * 0.6, height: webHeight }}
      scrollEnabled={false}
      onMessage={event => setWebHeight(Number(event.nativeEvent.data) + 10)}
    />
  );
};

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    setMessages([{ text: "Olá! Como posso te ajudar a estudar? - Dr. Rob. Otto", isUser: false, key: 'welcome' }]);
    return () => setMessages([]); // limpa o chat ao sair da tela
  }, []);

  const scrollToBottom = () => flatListRef.current?.scrollToEnd({ animated: true });

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, isUser: true, key: String(Date.now()) };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: updatedMessages.map(msg => ({
        role: msg.isUser ? 'user' : 'model', // <--- corrigido aqui
        parts: [{ text: msg.text }]
      })),
      generationConfig: { maxOutputTokens: 4096 },
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
      setMessages(prev => [...prev, { text: 'Erro de conexão.', isUser: false, key: String(Date.now() + 2) }]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const renderMessageContent = (message) => {
    if (!message.isUser) {
      const parts = message.text.split(/(\$\$.*?\$\$)/g).filter(Boolean);
      return (
        <View style={styles.aiMessageContainer}>
          <Image source={require('../assets/iconhead.png')} style={styles.aiIcon} resizeMode="contain" />
          <View style={styles.aiMessageContent}>
            {parts.map((part, idx) => {
              if (part.startsWith('$$') && part.endsWith('$$')) {
                const latex = part.slice(2, -2);
                return <LaTeXBlock key={idx} latex={latex} />;
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
    <View
      key={item.key}
      style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}
    >
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
        contentContainerStyle={{ paddingVertical: 10 }}
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
          multiline
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
  messageList: { flex: 1, paddingHorizontal: 10 },
  messageBubble: { padding: 12, marginVertical: 4, maxWidth: '85%' },
  userBubble: {
    backgroundColor: '#A1C4FC',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 3,
  },
  aiBubble: {
    backgroundColor: '#EEE',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 15,
  },
  aiMessageContainer: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  aiIcon: { width: 32, height: 32, marginRight: 8, borderRadius: 16 },
  aiMessageContent: { flexDirection: 'column', flexShrink: 1 },
  messageText: { fontSize: 16, color: '#333', flexWrap: 'wrap' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 5 },
  loadingText: { marginLeft: 8, color: '#666' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#DDD' },
  input: { flex: 1, borderWidth: 1, borderColor: '#A1C4FC', borderRadius: 25, paddingHorizontal: 18, paddingVertical: 12, marginRight: 8, maxHeight: 150 },
  sendButton: { backgroundColor: '#A1C4FC', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'center' },
  sendButtonText: { color: 'white', fontWeight: 'bold' }
});

export default ChatScreen;