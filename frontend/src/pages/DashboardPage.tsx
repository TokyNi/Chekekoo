import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { getVerification } from "@/services/api";
import type { VerificationResponse, Verdict } from "@/types/verification";

const verdictLabels: Record<Verdict, string> = {
  true: "Vrai",
  mostly_true: "Plutôt vrai",
  partially_true: "Partiellement vrai",
  misleading: "Trompeur",
  false: "Faux",
  unverifiable: "Non vérifiable",
};

function ScoreGauge({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  const isValidScore =
    score !== null && Number.isFinite(score) && score >= 0 && score <= 100;
  const value = isValidScore ? score : null;

  return (
    <div className="flex flex-col items-center rounded-3xl border border-line bg-panel p-6 text-center">
      <p className="text-sm text-mist">{label}</p>
      <div
        className="relative mt-5 grid h-36 w-36 place-items-center rounded-full"
        style={{
          background: value === null
            ? "conic-gradient(#363636 0deg, #363636 360deg)"
            : `conic-gradient(#ff8c00 ${value * 3.6}deg, #363636 0deg)`,
        }}
        role="img"
        aria-label={
          value === null ? `${label} indisponible` : `${label} : ${value} %`
        }
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-panel">
          {value === null ? (
            <span className="max-w-20 text-xs leading-5 text-mist">
              Données insuffisantes
            </span>
          ) : (
            <span className="text-3xl font-semibold text-mark">
              {Math.round(value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Date non précisée";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [verification, setVerification] = useState<VerificationResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    if (!id) {
      setError("Identifiant de vérification manquant.");
      setIsLoading(false);
      return;
    }

    getVerification(id)
      .then((result) => {
        if (active) setVerification(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger cette vérification.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const sourceChart = useMemo(() => {
    if (!verification) return [];
    const counts = new Map<string, number>();
    for (const source of verification.analysis.sources) {
      counts.set(source.position, (counts.get(source.position) ?? 0) + 1);
    }
    return [...counts].map(([position, count]) => ({ position, count }));
  }, [verification]);

  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-50" />
      <div className="relative mx-auto min-h-screen max-w-7xl">
        <Header />
        <main className="px-5 py-8 md:px-10 md:py-12">
          {isLoading ? (
            <div className="grid min-h-96 place-items-center">
              <div className="text-center">
                <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-mark/30 border-t-mark" />
                <p className="mt-4 text-sm text-mist">Chargement de l'analyse…</p>
              </div>
            </div>
          ) : error ? (
            <section className="mx-auto max-w-xl rounded-3xl border border-warn/30 bg-panel p-8 text-center">
              <h1 className="text-2xl font-semibold">Analyse indisponible</h1>
              <p role="alert" className="mt-3 text-sm text-mist">{error}</p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-xl bg-mark px-5 py-3 text-sm font-semibold text-ink"
              >
                Retour à l'accueil
              </Link>
            </section>
          ) : verification ? (
            <>
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mark">
                    Rapport de vérification
                  </p>
                  <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">
                    {verification.content}
                  </h1>
                  <p className="mt-3 text-sm text-mist">
                    Analyse du {formatDate(verification.created_at)}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-mark/40 bg-mark/10 px-4 py-2 text-sm font-medium text-mark">
                  {verdictLabels[verification.analysis.verdict]}
                </span>
              </div>

              {verification.source_url ? (
                <p className="mt-5 text-sm text-mist">
                  URL fournie :{" "}
                  <a
                    className="break-all text-mark underline underline-offset-4"
                    href={verification.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {verification.source_url}
                  </a>
                </p>
              ) : null}

              <section className="mt-8 grid gap-4 sm:grid-cols-2">
                <ScoreGauge
                  label="Fiabilité de l'information"
                  score={verification.analysis.reliability_score}
                />
                <ScoreGauge
                  label="Confiance de l'analyse"
                  score={verification.analysis.confidence_score}
                />
              </section>

              <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-3xl border border-line bg-panel p-6 md:p-8">
                  <h2 className="text-lg font-semibold">Synthèse</h2>
                  <p className="mt-3 leading-7 text-mist">
                    {verification.analysis.summary}
                  </p>
                  <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-mark">
                    Conclusion
                  </h3>
                  <p className="mt-2 leading-7 text-paper">
                    {verification.analysis.conclusion}
                  </p>
                  <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-mark">
                    Arguments relevés
                  </h3>
                  {verification.analysis.arguments.length ? (
                    <ul className="mt-3 space-y-3">
                      {verification.analysis.arguments.map((argument, index) => (
                        <li
                          key={`${index}-${argument}`}
                          className="rounded-xl bg-raised px-4 py-3 text-sm leading-6 text-mist"
                        >
                          {argument}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-mist">
                      Aucun argument de source externe disponible.
                    </p>
                  )}
                </article>

                <article className="rounded-3xl border border-line bg-panel p-6 md:p-8">
                  <h2 className="text-lg font-semibold">Comparaison des avis</h2>
                  {sourceChart.length ? (
                    <div className="mt-5 h-64" aria-label="Nombre d'avis par position">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sourceChart} layout="vertical">
                          <CartesianGrid stroke="#363636" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} stroke="#a7a7a7" />
                          <YAxis
                            type="category"
                            dataKey="position"
                            width={110}
                            stroke="#a7a7a7"
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            cursor={{ fill: "#ffffff10" }}
                            contentStyle={{
                              background: "#242424",
                              border: "1px solid #363636",
                              borderRadius: 12,
                              color: "#f5f5f5",
                            }}
                          />
                          <Bar dataKey="count" name="Évaluations" fill="#ff8c00" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-5 grid h-64 place-items-center rounded-2xl bg-raised px-6 text-center text-sm text-mist">
                      Aucun avis de fact-checking n'a été trouvé pour cette
                      information.
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-5 text-mist">
                    Le graphique présente uniquement le nombre d'évaluations
                    réellement retournées par le fournisseur.
                  </p>
                </article>
              </section>

              <section className="mt-5 rounded-3xl border border-line bg-panel p-6 md:p-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Sources consultées</h2>
                    <p className="mt-1 text-sm text-mist">
                      {verification.analysis.sources.length} évaluation(s)
                      éditoriale(s) trouvée(s)
                    </p>
                  </div>
                  <p className="text-xs text-mist">
                    La crédibilité éditoriale n'est pas notée par le fournisseur.
                  </p>
                </div>
                {verification.analysis.sources.length ? (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-line text-xs uppercase tracking-wide text-mist">
                          <th className="px-3 py-3 font-medium">Source</th>
                          <th className="px-3 py-3 font-medium">Date</th>
                          <th className="px-3 py-3 font-medium">Crédibilité</th>
                          <th className="px-3 py-3 font-medium">Position</th>
                          <th className="px-3 py-3 font-medium">Éléments de preuve</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verification.analysis.sources.map((source, index) => (
                          <tr
                            key={`${source.url}-${index}`}
                            className="border-b border-line/60 align-top last:border-0"
                          >
                            <td className="px-3 py-4">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-mark underline underline-offset-4 hover:text-paper"
                              >
                                {source.name}
                              </a>
                            </td>
                            <td className="px-3 py-4 text-mist">{formatDate(source.date)}</td>
                            <td className="px-3 py-4 text-mist">Non évaluée</td>
                            <td className="px-3 py-4 text-paper">{source.position}</td>
                            <td className="max-w-sm px-3 py-4 leading-6 text-mist">
                              {source.evidence}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-5 rounded-2xl bg-raised p-5 text-sm text-mist">
                    Aucune source originale n'est disponible. Le verdict reste
                    « Non vérifiable » tant que des preuves fiables ne sont pas
                    accessibles.
                  </p>
                )}
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
