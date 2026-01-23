import { EncounterConfig } from "../types";

export const ENCOUNTERS: EncounterConfig[] = [
    {
        id: "first",
        name: "Defend",
        type: "combat",
        category: "loop",
        order: "random",
        enemies: ["slime"],
        numberOfEnemies: 1,
        completionMessage: "You have defended",
        globalCompletionEffects: [
            { type: "increase_value", itemID: "mana_shard_0", amount: 1 },
            { type: "increase_value", resourceID: "days", amount: 1 },
        ],
        unitCompletionEffects: [],
        failureMessage: "You have failed to defend",
        globalFailureEffects: [
            { type: "increase_value", resourceID: "days", amount: 1 },
        ],
        unitFailureEffects: [],
    },
]