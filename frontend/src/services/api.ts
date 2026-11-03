import type {
  CreateVerificationPayload,
  VerificationResponse,
} from "@/types/verification";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function createVerification(
  payload: CreateVerificationPayload,
): Promise<VerificationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/verifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Impossible de lancer l'analyse de vérification.";
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail
          .map((item) =>
            typeof item === "object" && item && "msg" in item
              ? String(item.msg)
              : String(item),
          )
          .join(" ");
      }
    } catch {
      /* keep default message */
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as VerificationResponse;
}

export async function getVerification(
  id: string,
): Promise<VerificationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/verifications/${encodeURIComponent(id)}`,
  );
  if (!response.ok) {
    throw await readApiError(response, "Impossible de charger cette vérification.");
  }
  return (await response.json()) as VerificationResponse;
}

export async function getVerificationHistory(): Promise<VerificationResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/verifications`);
  if (!response.ok) {
    throw await readApiError(response, "Impossible de charger l'historique.");
  }
  return (await response.json()) as VerificationResponse[];
}

async function readApiError(response: Response, fallback: string): Promise<ApiError> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") {
      return new ApiError(body.detail, response.status);
    }
  } catch {
    // Utilise le message de repli quand la réponse n'est pas au format JSON.
  }
  return new ApiError(fallback, response.status);
}
