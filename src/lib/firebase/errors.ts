export class RaffleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RaffleError";
  }
}

export function raffleErrorMessage(error: unknown, fallback: string) {
  if (error instanceof RaffleError) return error.message;
  if (error instanceof Error && error.message.trim()) {
    if (error.message.includes("Variável de ambiente")) {
      return "O Firebase ainda não está configurado. Siga o README para ligar o projeto.";
    }
  }
  return fallback;
}
