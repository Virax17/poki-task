/** Raw evolution-chain species row from the PokéAPI GraphQL endpoint. */
export interface RawEvolutionSpecies {
  id: number;
  name: string;
  evolves_from_species_id: number | null;
  pokemonevolutions: {
    min_level: number | null;
    min_happiness: number | null;
    time_of_day: string | null;
    item: { name: string } | null;
    evolutiontrigger: { name: string } | null;
  }[];
}

/** One Pokémon in an evolution chain. */
export interface EvolutionNode {
  id: number;
  name: string;
  /** Species this one evolves from; `null` for the first form. */
  parentId: number | null;
  /** Human-readable requirement to evolve into this form, e.g. "Lv. 16". */
  condition: string | null;
}

/** Nodes grouped by evolution depth: stage 0 = base form, stage 1 = first evolution, … */
export type EvolutionStage = EvolutionNode[];
