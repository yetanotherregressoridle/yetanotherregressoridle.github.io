import { EnemyConfig } from "../types";

export const ENEMIES: EnemyConfig[] = [
    {
        id: "slime",
        name: "Slime",
        health: 5,
        mana: 1,
        description: "Oozing around",
        skills: [
            "mana_attack",
        ],
        completionEffects: [
            {
                type: "increase_value",
                itemID: "mana_shard_0",
                amount: 1,
                chance: 0.1,
            },
        ],
    },
]