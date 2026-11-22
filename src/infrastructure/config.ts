function requiredEnv(name: "MONGO_URI" | "JWT_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const runtime = {
  mongoURI: requiredEnv("MONGO_URI"),
  jwt: requiredEnv("JWT_SECRET"),
};
