# calculAI

O **calculAI** é um aplicativo móvel de estudos integrado com inteligência artificial, desenvolvido especificamente para apoiar o aprendizado, a resolução de problemas e a revisão de conceitos em matemática e estatística. Construído com tecnologias móveis modernas e modelos avançados de linguagem, o calculAI atua como um companheiro inteligente para estudantes que navegam por disciplinas quantitativas complexas.

## Principais Funcionalidades

- **Assistente Matemático com IA:** Integra capacidades do Google GenAI para detalhar demonstrações complexas, cálculos estatísticos e problemas de álgebra.
- **Renderização Matemática Avançada:** Suporte completo para formatação matemática e LaTeX funcional.
- **Interface de Estudo Interativa:** Design móvel limpo e responsivo com suporte a temas consistentes via `ThemeContext`.
- **Armazenamento Local Persistente:** Utiliza AsyncStorage para manter estados de sessões e históricos de estudos dos usuários.

## Tecnologias Utilizadas (Tech Stack)

| Camada | Tecnologias / Bibliotecas |
| :--- | :--- |
| **Framework** | React Native (v0.81.4), Expo (v54.0.12), React (v19.1.0) |
| **Navegação** | React Navigation (Stack & Native) |
| **IA & Backend** | Google GenAI SDK (`@google/genai`), Firebase |
| **Interface & Matemática** | KaTeX, React Native WebView, Markdown Display, Vector Icons (SVG) |
| **Armazenamento** | AsyncStorage |

## Estrutura do Repositório

```text
calculai/
├── android/               # Configurações nativas do Android
├── assets/                # Recursos visuais, ícones e mídias
├── node_modules/          # Dependências do projeto
├── screens/               # Telas da aplicação (incluindo a tela de planejamento)
├── .gitignore             # Arquivos ignorados pelo Git
├── App.js                 # Ponto de entrada principal
├── ThemeContext.js        # Contexto de gerenciamento de temas consistentes
├── app.json               # Configuração do Expo
├── eas.json               # Configurações do EAS Build
├── index.js               # Ponto de registro do app
├── metro.config.js        # Configuração do empacotador Metro
├── package-lock.json      # Versões travadas das dependências
└── package.json           # Dependências e scripts do projeto
```

## Como Começar (Getting Started)

Clone o repositório:

```bash
git clone https://github.com/weltondionisio/calculAI.git
```

Instale as dependências:

```bash
npm install
```

Execute o servidor de desenvolvimento com o Expo:

```bash
npx expo start
```

## Autor

Desenvolvido por Dr. Welton Dionisio.

---

## Clique p/ assistir a demonstração em vídeo

<p align="center">
  <h3>🎬 Clique para assistir à demonstração em vídeo do calculAI</h3>
  <a href="https://www.youtube.com/shorts/-fK71En1Bgk">
    <img src="https://img.youtube.com/vi/-fK71En1Bgk/maxresdefault.jpg" alt="calculAI - Demo do Protótipo" width="800px">
  </a>
</p>
