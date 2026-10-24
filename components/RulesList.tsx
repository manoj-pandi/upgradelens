// The "What it checks" section: every rule the scanner runs, split into two groups.
import { BEHAVIOR_RULES, MIGRATION_GUIDE_URL, REMOVED_RULES, type RuleKind } from "@/lib/ruleMeta";
import Container from "./Container";

interface KindBadgeProps {
  kind: RuleKind;
  count: number;
}

// Colored pill showing how serious a group of rules is and how many rules it has.
const KindBadge = ({ kind, count }: KindBadgeProps) => {
  // Orange for crashes, blue for silent bugs. The same colors are used on the report page.
  const styles =
    kind === "removed"
      ? "border-removed-line bg-removed-bg text-removed"
      : "border-behavior-line bg-behavior-bg text-behavior";
  const label = kind === "removed" ? "App crashes" : "Silent bugs";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${styles}`}>
      {label} · {count} rules
    </span>
  );
};

const RulesList = () => {
  return (
    // id="rules" is the target of the "What it checks" link in the header
    <section id="rules" aria-labelledby="rules-title" className="scroll-mt-4 border-t border-line">
      <Container className="flex flex-col gap-8 py-18">
        <div className="flex flex-col gap-2">
          <h2 id="rules-title" className="text-3xl font-bold tracking-tight">What it checks</h2>
          <p className="max-w-170 text-muted">
            {REMOVED_RULES.length + BEHAVIOR_RULES.length} rules from the{" "}
            <a href={MIGRATION_GUIDE_URL} className="text-link underline-offset-2 hover:underline">
              official Express 5 migration guide
            </a>
            , including the silent changes that have no codemod.
          </p>
        </div>

        {/* Two cards side by side on wide screens, stacked on narrow ones */}
        <div className="flex flex-wrap gap-5">
          {/* Card 1: APIs that no longer exist, so calling them crashes */}
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-[14px] border border-line bg-surface p-5.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Removed APIs</h3>
              <KindBadge kind="removed" count={REMOVED_RULES.length} />
            </div>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-2 font-mono text-sm text-foreground">
              {REMOVED_RULES.map((rule) => (
                // The tooltip explains the fix when you hover over the old code
                <li key={rule.id} title={rule.description}>{rule.code}</li>
              ))}
            </ul>
          </div>

          {/* Card 2: code that still runs but behaves differently */}
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-[14px] border border-line bg-surface p-5.5">
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
};

export default RulesList;
