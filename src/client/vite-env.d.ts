/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_MODE?: string
  readonly VITE_BYPASS_DAILY_LIMIT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}