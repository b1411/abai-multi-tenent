declare module "react-katex";

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // добавьте другие переменные env здесь
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
