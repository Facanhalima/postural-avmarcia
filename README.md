# PosturAI - Avaliação Postural Digital

Uma aplicação React moderna para avaliação postural em tempo real usando inteligência artificial e visão computacional.

## 🚀 Funcionalidades

- **Análise Postural em Tempo Real**: Detecção automática de pontos corporais usando MediaPipe
- **Interface Clínica Intuitiva**: Formulário para dados do paciente e histórico
- **Análise Biomecânica Automatizada**: Cálculos de alinhamento para ombros, pelve, joelhos e cervical
- **Simetrógrafo Virtual**: Grade de referência sobreposta na imagem
- **Geração de Laudos PDF**: Relatórios profissionais com análise e imagem
- **Design Responsivo**: Interface moderna construída com Tailwind CSS

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework frontend
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **MediaPipe** - Biblioteca de detecção de pose da Google
- **jsPDF** - Geração de PDFs
- **Vite** - Build tool e dev server

## 📋 Pré-requisitos

- Node.js 18+ 
- Navegador moderno com suporte a WebRTC
- Câmera web funcional
- HTTPS (para produção)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd AVMarcia
```

2. Instale as dependências:
```bash
npm install
```

3. Execute em modo desenvolvimento:
```bash
npm run dev
```

4. Acesse `http://localhost:5173` no navegador

## 📖 Como Usar

1. **Permita o acesso à câmera** quando solicitado
2. **Posicione o paciente** de corpo inteiro no campo de visão
3. **Preencha os dados clínicos** na barra lateral
4. **Aguarde a análise automática** dos pontos posturais
5. **Gere o laudo PDF** com os resultados

## 🚀 Build para Produção

```bash
npm run build
```

## ⚠️ Considerações Importantes

- **HTTPS Obrigatório**: MediaPipe requer HTTPS em produção
- **Permissões de Câmera**: Usuário deve autorizar acesso
- **Iluminação Adequada**: Ambiente bem iluminado melhora a detecção

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
