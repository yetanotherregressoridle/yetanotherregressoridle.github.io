import { ActionConfig } from "../types";

export const ACTIONS: ActionConfig[] = [
    {
        id: "survive",
        name: "Survive",
        category: "common",
        description: "Run and hide to survive one more day.",
        flavorText: "abc",
        globalEffects: [{ type: "increase_value", resourceID: "days", amount: 1 }],
        unitEffects: [],
        prerequisites: [{ resourceID: "days", valueLessThanMax: true }],
    },
    {
        id: "rest",
        name: "Rest",
        category: "common",
        description: "Rest and recover.",
        flavorText: "123",
        globalEffects: [
            { type: "increase_value", resourceID: "days", amount: 1 }
        ],
        unitEffects: [
            { type: "increase_value", target: 'mainCharacter', stat: 'health', amount: 1 },
        ],
        prerequisites: [{ resourceID: "days", valueLessThanMax: true }],
    },
    {
        id: "awaken",
        name: "Awaken",
        category: "story",
        description: "Awaken",
        flavorText: "abc",
        globalEffects: [],
        unitEffects: [{ type: "increase_max", target: 'mainCharacter', stat: 'mana', amount: 1 }],
        maxExecutions: 1,
        prerequisites: [
            { unit: "mainCharacter", unitStat: "mana", maxMax: 0 },
            { resourceID: "days", valueEqualToMax: true }
        ],
    },
    {
        id: "loop",
        name: "Loop",
        category: "loop",
        description: "Loop",
        flavorText: "123",
        globalEffects: [],
        unitEffects: [],
        prerequisites: [{ resourceID: "days", valueEqualToMax: true }, { resourceID: "mana", minMax: 1 }],
    },
    {
        id: "battle",
        name: "Battle",
        category: "loop",
        description: "Battle an enemy",
        flavorText: "abc",
        globalEffects: [{ type: "start_encounter", encounterID: "first" }],
        unitEffects: [],
        prerequisites: [{ resourceID: "days", valueLessThanMax: true }],
    },
]