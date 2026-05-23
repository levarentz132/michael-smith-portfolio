# React + TypeScript + Vite

Template ini menyediakan setup minimal untuk menjalankan React di Vite dengan HMR dan beberapa aturan ESLint.

Saat ini, dua plugin resmi tersedia:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) menggunakan [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) menggunakan [SWC](https://swc.rs/)

## React Compiler

React Compiler tidak diaktifkan pada template ini karena dampaknya pada performa dev & build. Untuk menambahkannya, lihat [dokumentasi ini](https://react.dev/learn/react-compiler/installation).

## Memperluas Konfigurasi ESLint

Jika Anda mengembangkan aplikasi produksi, kami merekomendasikan memperbarui konfigurasi untuk mengaktifkan aturan lint yang sadar tipe:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Config lainnya...

      // Hapus tseslint.configs.recommended dan ganti dengan ini
      tseslint.configs.recommendedTypeChecked,
      // Alternatifnya, gunakan ini untuk aturan yang lebih ketat
      tseslint.configs.strictTypeChecked,
      // Opsional, tambahkan ini untuk aturan stylistik
      tseslint.configs.stylisticTypeChecked,

      // Config lainnya...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // opsi lainnya...
    },
  },
])
```

Anda juga dapat menginstal [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) dan [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) untuk aturan lint khusus React:

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
