import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createVerification } from "@/services/api";

export function VerificationForm() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = content.trim();
    const trimmedUrl = sourceUrl.trim();
    const isContentUrl = /^https?:\/\/\S+$/i.test(trimmed);
    if (!trimmed && !trimmedUrl) {
      setError("Saisissez une information ou une URL à vérifier.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        content: trimmed || trimmedUrl,
        ...((trimmedUrl || (isContentUrl ? trimmed : "")) && {
          source_url: trimmedUrl || trimmed,
        }),
      };
      const response = await createVerification(payload);
      navigate(`/dashboard/${response.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Une erreur inattendue est survenue pendant l'analyse.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-line bg-panel/90 p-6 shadow-[0_24px_80px_rgb(0_0_0_/_.35)] backdrop-blur md:p-8"
    >
      <label htmlFor="content" className="block text-sm font-medium text-paper">
        Information à vérifier
      </label>
      <textarea
        id="content"
        name="content"
        rows={7}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Collez un extrait, une affirmation, un titre d'article…"
        className="mt-2 w-full resize-y rounded-2xl border border-line bg-raised px-4 py-3 text-sm leading-6 text-paper outline-none placeholder:text-mist/70 focus:border-mark/70 focus:ring-2 focus:ring-mark/20"
      />

      <label
        htmlFor="source_url"
        className="mt-5 block text-sm font-medium text-paper"
      >
        URL ou source (optionnel si vous saisissez un texte)
      </label>
      <input
        id="source_url"
        name="source_url"
        type="url"
        value={sourceUrl}
        onChange={(event) => setSourceUrl(event.target.value)}
        placeholder="https://… (ou collez une URL dans le champ ci-dessus)"
        className="mt-2 w-full rounded-2xl border border-line bg-raised px-4 py-3 text-sm text-paper outline-none placeholder:text-mist/70 focus:border-mark/70 focus:ring-2 focus:ring-mark/20"
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-mist">
          Les résultats reposent sur les évaluations éditoriales accessibles au
          service. Aucune source ni aucun score ne seront inventés.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-mark px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mark/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
              Analyse en cours…
            </span>
          ) : (
            "Vérifier l'information"
          )}
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn"
        >
          {error}
        </p>
      ) : null}

    </form>
  );
}
