const requiredEnvironmentVariable = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getSupabaseConfig = () => ({
  url: requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
  anonKey: requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
});
