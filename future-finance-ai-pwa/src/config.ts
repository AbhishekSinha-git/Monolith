import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_OAUTH_GOOGLE_CLIENT_ID: z.string().min(10),
  VITE_OAUTH_REDIRECT_URI: z.string().url(),
  VITE_GEMINI_MODEL: z.string().default('models/gemini-1.5-pro'),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
});

type Env = z.infer<typeof EnvSchema>;

const rawEnv = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  VITE_OAUTH_GOOGLE_CLIENT_ID: import.meta.env.VITE_OAUTH_GOOGLE_CLIENT_ID as string,
  VITE_OAUTH_REDIRECT_URI: import.meta.env.VITE_OAUTH_REDIRECT_URI as string,
  VITE_GEMINI_MODEL: (import.meta.env.VITE_GEMINI_MODEL as string) ?? 'models/gemini-1.5-pro',
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
};

const parsed = EnvSchema.safeParse(rawEnv);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env: Env = parsed.data;

export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL,
  oauth: {
    googleClientId: env.VITE_OAUTH_GOOGLE_CLIENT_ID,
    redirectUri: env.VITE_OAUTH_REDIRECT_URI,
  },
  ai: {
    geminiModel: env.VITE_GEMINI_MODEL,
  },
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },
} as const;


