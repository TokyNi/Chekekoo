import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-line/70 px-6 py-5 md:px-10">
      <Link to="/" className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mark/15 ring-1 ring-mark/40">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-mark"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 13l4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="font-display text-xl leading-none tracking-tight">
            Checkeko
          </p>
          <p className="mt-1 text-xs text-mist">Fiabilité des informations</p>
        </div>
      </Link>
      <Link to="/" className="text-sm text-mist transition hover:text-mark">
        Nouvelle analyse
      </Link>
    </header>
  );
}
