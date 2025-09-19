// Development mode configuration
// This controls whether the app runs in development mode with the DevMenu
// or in production mode with the actual game

// Primary method: Environment variable (set in .env file)
const DEV_MODE_ENV = import.meta.env?.VITE_DEV_MODE === 'true';

// Fallback: Manual toggle (change this boolean to switch modes quickly)
const DEV_MODE_MANUAL = false;

// Final dev mode determination (env takes priority, then manual)
export const DEV_MODE = DEV_MODE_ENV || DEV_MODE_MANUAL;

// Daily limit bypass configuration
// This allows unlimited replays for testing purposes
// WARNING: Never enable this in production builds!

// Primary method: Environment variable (set in .env file)
const BYPASS_DAILY_LIMIT_ENV = import.meta.env?.VITE_BYPASS_DAILY_LIMIT === 'true';

// Fallback: Manual toggle (change this boolean to allow unlimited replays)
const BYPASS_DAILY_LIMIT_MANUAL = false;

// Final bypass determination (env takes priority, then manual)
export const BYPASS_DAILY_LIMIT = BYPASS_DAILY_LIMIT_ENV || BYPASS_DAILY_LIMIT_MANUAL;

// Helper function to log current mode
export function logDevMode() {
  console.log(`🚀 ThreadGuessr running in ${DEV_MODE ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
  if (DEV_MODE_ENV) console.log('  → Enabled via environment variable (VITE_DEV_MODE=true)');
  else if (DEV_MODE_MANUAL) console.log('  → Enabled via manual toggle in config.ts');
  else console.log('  → To enable dev mode: set VITE_DEV_MODE=true in .env file');

  if (BYPASS_DAILY_LIMIT) {
    console.log('⚠️  Daily limit BYPASSED - unlimited replays enabled');
    if (BYPASS_DAILY_LIMIT_ENV) console.log('  → Enabled via environment variable (VITE_BYPASS_DAILY_LIMIT=true)');
    else if (BYPASS_DAILY_LIMIT_MANUAL) console.log('  → Enabled via manual toggle in config.ts');
    console.log('  → WARNING: This should NEVER be enabled in production!');
  }
}