import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';

const SYSTEM_PROMPT = `Você é o "CalculAI", professor de matemática, data science, programação e inteligência artificial. E é capaz de auxiliar do ensino médio até universitário. Explique passo a passo, use LaTeX delimitado por $ ou $$ e adapte ao nível do usuário. Recuse educamente falar sobre qualquer coisa fora desse escopo.`;

const API_KEY = 'AIzaSyBLsSMLqMkX0wXODwsOheMl4jyEooqW2v8';
const screenWidth = Dimensions.get('window').width;

// ----------------------------------------------------------------------
// ---------- COMPONENTE: Renderizador de LaTeX (RENDERIZAÇÃO MANUAL INJETADA) ----------
// ----------------------------------------------------------------------
const LatexRenderer = React.memo(({ latex, isDisplayMath }) => {
  // Key para forçar a remontagem do WebView
  const [webViewKey, setWebViewKey] = useState(Date.now()); 
  
  const finalLatex = isDisplayMath ? `\\displaystyle ${latex}` : latex;
  const staticHeightFallback = isDisplayMath ? 85 : 45; // Altura de fallback para reservar espaço

  // Força a remontagem após um pequeno atraso para estabilizar o layout do FlatList.
  useEffect(() => {
    const timer = setTimeout(() => {
      setWebViewKey(Date.now()); 
    }, 200); 
    return () => clearTimeout(timer);
  }, [latex]);

  const htmlContent = useMemo(() => {
    // Escapa as strings de LaTeX para serem injetadas no JavaScript
    const escapedLatex = finalLatex.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    // Script injetado para renderizar o KaTeX manualmente no elemento #math
    const injectedScript = `
      document.addEventListener('DOMContentLoaded', function() {
        var mathDiv = document.getElementById('math');
        
        try {
          // Renderiza a fórmula LaTeX manualmente
          katex.render("${escapedLatex}", mathDiv, {
            displayMode: ${isDisplayMath},
            throwOnError: false
          });

          // Hack de altura: Garante que o WebView tenha a altura correta (minHeight)
          setTimeout(() => {
              var height = mathDiv.offsetHeight + 10;
              if (height > 0) {
                  // Define a altura mínima no div #math
                  mathDiv.style.minHeight = height + 'px'; 
                  // Força o body a se ajustar também
                  document.body.style.minHeight = height + 'px';
              }
          }, 50);

        } catch (e) {
          // Mostra o erro em vermelho se o KaTeX falhar
          mathDiv.innerHTML = '<span style="color: red;">Erro KaTeX: ' + e.message + '</span>';
        }
      });
      true;
    `;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" crossorigin="anonymous">
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js" crossorigin="anonymous"></script>
      <style>
        body { margin: 0; padding: 0; background-color: transparent; } 
        #math { display: inline-block; padding: 0; margin: 0; } /* Onde a fórmula será renderizada */
        .katex-display { margin: 0; display: block; } 
        .katex { font-size: 1.1em; } 
      </style>
    </head>
    <body>
      <div id="math"></div>
      <script>${injectedScript}</script>
    </body>
    </html>
  `;
  }, [finalLatex, isDisplayMath]); 

  return (
    // Usa a altura de fallback. O JS injetado forçará o conteúdo a esticar a View.
    <View style={{ width: screenWidth * 0.7, height: staticHeightFallback, marginVertical: 4 }}>
      <WebView
        key={webViewKey} 
        source={{ html: htmlContent }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
});


// ----------------------------------------------------------------------
// ---------- COMPONENTE SmartMessage (AJUSTADO) ----------
// ----------------------------------------------------------------------
const SmartMessage = React.memo(({ content }) => { 
  const splitContent = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <View style={{ flexShrink: 1, flexDirection: 'column' }}>
      {splitContent.filter(Boolean).map((part, index) => {
        const isLatex = (part.startsWith('$') && part.endsWith('$'));
        const key = `${part.substring(0, 10)}-${index}`;
        
        if (isLatex) {
          const cleanLatexMatch = part.match(/^\s*\$\$?\s*([\s\S]*?)\s*\$\$?\s*$/s);
          let finalLatex = cleanLatexMatch ? cleanLatexMatch[1] : '';

          if (!finalLatex || finalLatex.trim().length === 0) {
              return null;
          }
          
          finalLatex = finalLatex.trim();
          finalLatex = finalLatex.replace(/^\\n\s*|\s*\\{1,2}\s*$/g, '').trim(); 
          
          const isDisplayMath = part.startsWith('$$');

          return (
            <LatexRenderer 
                key={key}
                latex={finalLatex} 
                isDisplayMath={isDisplayMath} 
            />
          );
        } else if (part.trim().length > 0) {
          return (
            <Text key={key} style={styles.messageText}>
              {part.trim()}
            </Text>
          );
        }
        return null;
      })}
    </View>
  );
});


// ----------------------------------------------------------------------
// ---------- CHATSCREEN PRINCIPAL (INALTERADO) ----------
// ----------------------------------------------------------------------
const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        text: "Olá! Como posso te ajudar a estudar?",
        isUser: false,
        key: String(Date.now()),
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, isUser: true, key: String(Date.now()) };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
      const allMessages = [...messages, userMessage];

      const payload = {
        systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] }, 
        contents: allMessages.map((msg) => ({
          role: msg.isUser ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
        generationConfig: { maxOutputTokens: 2048 },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      let aiText = 'Desculpe, não consegui obter uma resposta.';
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiText = result.candidates[0].content.parts[0].text;
      } else if (result.error) {
        aiText = `Erro da API: ${result.error.message}`;
      }

      const aiMessage = { text: aiText, isUser: false, key: String(Date.now() + Math.random()) };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: 'Erro de conexão.', isUser: false, key: String(Date.now() + Math.random()) },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item }) => (
    <View
      key={item.key} 
      style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}
    >
      {item.isUser ? (
        <Text style={styles.messageText}>{item.text}</Text>
      ) : (
        <View style={styles.aiMessageContainer}>
          <Image
            source={require('../assets/iconhead.png')}
            style={styles.aiIcon}
            resizeMode="contain"
          />
          <SmartMessage content={item.text} /> 
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.key}
        style={styles.messageList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
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
          scrollEnabled
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
          disabled={!input.trim() || loading}
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

// ---------- ESTILOS (INALTERADOS) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  messageList: { flex: 1, paddingHorizontal: 10 },
  messageBubble: { padding: 12, marginVertical: 4, maxWidth: '85%' },
  userBubble: {
    backgroundColor: '#A1C4FC',
    alignSelf: 'flex-end',
    borderRadius: 15,
    borderBottomRightRadius: 3,
  },
  aiBubble: {
    backgroundColor: '#EEE',
    alignSelf: 'flex-start',
    borderRadius: 15,
    borderBottomLeftRadius: 3,
  },
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1, 
  },
  aiIcon: { width: 32, height: 32, marginRight: 8, borderRadius: 16 },
  messageText: { fontSize: 16, color: '#333', flexShrink: 1 }, 
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 5 },
  loadingText: { marginLeft: 8, color: '#666' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#DDD' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#A1C4FC',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 150,
    minHeight: 40,
  },
  sendButton: { backgroundColor: '#A1C4FC', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'center' },
  sendButtonText: { color: 'white', fontWeight: 'bold' },
});

export default ChatScreen;