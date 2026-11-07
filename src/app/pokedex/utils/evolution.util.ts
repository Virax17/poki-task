import { EvolutionNode, EvolutionStage, RawEvolutionSpecies } from '../models/evolution.model';

type RawEvolutionRule = RawEvolutionSpecies['pokemonevolutions'][number];

function pretty(value: string): string {
  const text = value.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Turns the evolution rules of one species into a short label such as "Lv. 16" or "Use Fire stone".
 * When several rules exist (e.g. location-based variants) the first informative one wins.
 * @param rules Evolution rules that lead to the species.
 * @returns A label, or `null` when the species is a base form.
 */
export function describeCondition(rules: RawEvolutionRule[]): string | null {
  if (rules.length === 0) return null;

  const rule = rules.find((r) => r.item || r.min_level || r.min_happiness) ?? rules[0];
  const trigger = rule.evolutiontrigger?.name ?? '';
  const time = rule.time_of_day ? `, ${rule.time_of_day}` : '';

  if (rule.item) return `Use ${pretty(rule.item.name)}`;
  if (rule.min_level) return `Lv. ${rule.min_level}`;
  if (rule.min_happiness) return `Friendship${time}`;
  if (trigger === 'trade') return 'Trade';
  if (trigger === 'level-up') return `Level up${time}`;
  return trigger ? pretty(trigger) : null;
}

/**
 * Maps raw chain rows into evolution nodes.
 * @param rows Species belonging to one evolution chain.
 */
export function mapEvolutionChain(rows: RawEvolutionSpecies[]): EvolutionNode[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.evolves_from_species_id,
    condition: describeCondition(row.pokemonevolutions),
  }));
}

/**
 * Groups nodes by depth from the base form so a chain can be drawn left → right.
 * @param nodes Flat chain nodes.
 * @returns Stages ordered base → final; branching evolutions share a stage.
 */
export function buildEvolutionStages(nodes: EvolutionNode[]): EvolutionStage[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const depthOf = (node: EvolutionNode): number => {
    let depth = 0;
    let current: EvolutionNode | undefined = node;
    // Guard against malformed data creating a cycle.
    while (current?.parentId != null && byId.has(current.parentId) && depth < nodes.length) {
      current = byId.get(current.parentId);
      depth++;
    }
    return depth;
  };

  const stages: EvolutionStage[] = [];
  for (const node of nodes) {
    const depth = depthOf(node);
    (stages[depth] ??= []).push(node);
  }
  return stages.filter((stage) => !!stage);
}
