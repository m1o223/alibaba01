import { useId } from "react";
import type { IngredientExclusionConfig } from "./ingredientExclusionConfig";

type Props = {
  config: IngredientExclusionConfig;
  selected: readonly string[];
  onToggle: (key: string) => void;
};

export function IngredientExclusions({ config, selected, onToggle }: Props) {
  const hintId = useId();
  if (!config.options.length) return null;
  return <fieldset className="demo-ingredient-exclusions" aria-describedby={hintId}>
    <legend>Ta bort ingredienser</legend>
    <p id={hintId}>Välj det du inte vill ha i din rätt.</p>
    {config.verificationStatus !== "verified" ? <p className="demo-muted">Tillfälliga testval, inte bekräftade ingredienser.</p> : null}
    {config.options.map(option => <label className="demo-option" key={option.key}>
      <input type="checkbox" name="exclusions" value={option.key} checked={selected.includes(option.key)} onChange={() => onToggle(option.key)} />
      <span>{option.name}</span>
    </label>)}
  </fieldset>;
}
