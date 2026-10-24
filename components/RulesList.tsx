import { BEHAVIOR_RULES, MIGRATION_GUIDE_URL, REMOVED_RULES } from "@/lib/ruleMeta";
import Container from "./Container";


function KindBadge({ kind, count }: { kind: "removed" | "behavior"; count: number }) {
  const styles =
    kind === "removed"
      ? "border-orange-200 bg-removed-bg text-removed"
      : "border-blue-200 bg-behavior-bg text-behavior";
  const label = kind === "removed" ? "App crashes" : "Silent bugs";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${styles}`}>
      {label} · {count} rules
    </span>
  );
}

export default function RulesList() {
  return (
    <section id="rules" aria-labelledby="rules-title" className="scroll-mt-4 border-t border-line">
      <Container className="flex flex-col gap-8 py-18">
        <div className="flex flex-col gap-2">
          <h2 id="rules-title" className="text-3xl font-bold tracking-tight">What it checks</h2>
          <p className="max-w-170 text-muted">
            {REMOVED_RULES.length + BEHAVIOR_RULES.length} rules from the{" "}
            <a href={MIGRATION_GUIDE_URL} className="text-blue-700 underline-offset-2 hover:underline">
              official Express 5 migration guide
            </a>
            , including the silent changes that have no codemod.
          </p>
        </div>

        <div className="flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-[14px] border border-line bg-white p-5.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Removed APIs</h3>
              <KindBadge kind="removed" count={REMOVED_RULES.length} />
            </div>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-2 font-mono text-sm text-zinc-800">
              {REMOVED_RULES.map((rule) => (
                <li key={rule.id} title={rule.description}>{rule.code}</li>
              ))}
            </ul>
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-[14px] border border-line bg-white p-5.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Behavior changes</h3>
              <KindBadge kind="behavior" count={BEHAVIOR_RULES.length} />
            </div>
            <ul className="flex flex-col gap-3">
              {BEHAVIOR_RULES.map((rule) => (
                <li key={rule.id} className="flex flex-col gap-0.5">
                  <span className="font-mono text-sm whitespace-pre">{rule.code}</span>
                  <span className="text-sm text-muted">{rule.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}