import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { VerificationForm } from "@/components/verification/VerificationForm";
import { getVerificationHistory } from "@/services/api";
import type { VerificationResponse } from "@/types/verification";

export function HomePage() {
  const [history, setHistory] = useState<VerificationResponse[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    getVerificationHistory()
      .then(setHistory)
      .catch((cause: unknown) => {
        setHistoryError(
          cause instanceof Error
            ? cause.message
            : "L'historique est indisponible.",
        );
      });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <div className="pointer-events-none absolute inset-0 grid-overlay" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-mark/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-mark-dim/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col">
        <Header />

        <main className="grid flex-1 items-center gap-12 px-6 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:py-16">
          <section>
            <p className="text-sm font-medium tracking-[0.18em] text-mark uppercase">
              Vérification d’information
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              Avant de relayer une info, mesurez sa solidité.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-mist">
              Soumettez une affirmation ou un extrait pour rechercher les
              évaluations éditoriales disponibles et consulter leurs preuves.
              Lorsqu'aucune donnée vérifiable n'existe, Checkeko le signale
              clairement.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-mist">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-mark" />
                Saisie d’un contenu à vérifier
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-mark" />
                Analyse via le service de fact-checking
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-mark" />
                Historique conservé et consultable
              </li>
            </ul>
          </section>

          <VerificationForm />
        </main>
        <section className="px-6 pb-12 md:px-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mark">
                Votre activité
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Analyses récentes</h2>
            </div>
            <span className="text-sm text-mist">{history.length} résultat(s)</span>
          </div>
          {historyError ? (
            <p role="alert" className="rounded-2xl border border-warn/30 bg-panel p-4 text-sm text-warn">
              {historyError}
            </p>
          ) : history.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {history.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/dashboard/${item.id}`}
                    className="block rounded-2xl border border-line bg-panel p-5 transition hover:border-mark/60"
                  >
                    <p className="line-clamp-2 font-medium leading-6">{item.content}</p>
                    <p className="mt-3 text-xs text-mist">
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.created_at))}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-line bg-panel p-5 text-sm text-mist">
              Vos analyses apparaîtront ici et resteront disponibles après
              actualisation.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
