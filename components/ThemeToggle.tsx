"use client";

// A three-way switch in the header: Light, System, or Dark.
// It uses real radio inputs, so keyboard arrows and screen readers work without extra code.
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "./Icons";

const OPTIONS = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
] as const;

// Nothing to listen to; we only need to know "are we in the browser yet?"
const subscribe = () => () => {};

// Returns false while rendering on the server and true in the browser.
// The server can't read the saved theme, so we wait until we're in the browser before marking one as selected.
const useIsBrowser = () => useSyncExternalStore(subscribe, () => true, () => false);

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isBrowser = useIsBrowser();

  // On the server (and the first browser render), no option is selected. This avoids a hydration mismatch.
  const selected = isBrowser ? theme : undefined;

  return (
    <fieldset className="flex rounded-lg border border-line p-0.5">
      <legend className="sr-only">Theme</legend>

      {OPTIONS.map(({ value, label, Icon }) => (
        // The label is the visible button. The radio inside is hidden but still focusable and clickable.
        <label
          key={value}
          title={label}
          className="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted hover:text-foreground has-checked:bg-subtle has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-focus"
        >
          <input
            type="radio"
            name="theme"
            value={value}
            checked={selected === value}
            onChange={() => setTheme(value)}
            className="sr-only"
          />
          <Icon size={18} />
          {/* Screen readers read this text; sighted users see the icon and the tooltip. */}
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
  );
};

export default ThemeToggle;
