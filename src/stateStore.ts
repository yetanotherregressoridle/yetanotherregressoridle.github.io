import { createStore, SetStoreFunction } from "solid-js/store";
import { GlobalEffectConfig, ResourceState, ActionConfig, ActionState, Prerequisite, ResourceID, ActionID, EncounterState, ItemState, ItemID, AllyCombatState, EnemyCombatState, PartyUnitID, MainCharacterPartyUnitID, UnitEffect, UnitState, PartyUnitState, SkillID, EnemyPartyUnitID, UnitEffectOptions, ThemeID } from "./types";
import { RESOURCES, ACTIONS, RESOURCE_CONFIG_MAP, ACTION_CONFIG_MAP, ENCOUNTER_CONFIG_MAP, ENEMY_CONFIG_MAP, SKILL_CONFIG_MAP } from "./base";

interface State {
    count: number;
    resources: Record<ResourceID, ResourceState>;
    actions: Record<ActionID, ActionState>;
    items: Record<ItemID, ItemState>;
    party: Record<PartyUnitID, PartyUnitState>;
    activeParty: PartyUnitID[];
    encounter: EncounterState | null;
    logs: string[];
    theme: ThemeID;
}

const initialState: State = {
    count: 0,
    resources: {},
    actions: {},
    items: {},
    party: {},
    activeParty: [],
    encounter: null,
    logs: [],
    theme: "system",
}

interface StateApi {
    increment: () => void;
    decrement: () => void;
    initialize: (stateApi: StateApi) => void;
    computeVisibility: (id: ResourceID | ActionID) => boolean;
    computeEnabled: (id: ResourceID | ActionID) => boolean;
    doAction: (action: ActionConfig) => void;
    applyGlobalEffects: (effects: GlobalEffectConfig[]) => void;
    applyGlobalEffect: (effect: GlobalEffectConfig) => void;
    applyUnitEffects: (effects: UnitEffect[]) => void;
    applyUnitEffect: (effect: UnitEffect) => void;
    addLog: (log: string) => void;
    runEncounter: (delta: number) => void;
    setTheme: (theme: ThemeID) => void;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export type StateStore = [State, StateApi];

export function createStateStore(): StateStore {
    const [stateStore, setStateStore] = createStore(initialState);
    const stateApi: StateApi = {
        increment: () => setStateStore("count", current => current + 1),
        decrement: () => setStateStore("count", current => current - 1),
        initialize: (stateApi: StateApi) => {
            setStateStore("party", MainCharacterPartyUnitID, {
                id: MainCharacterPartyUnitID,
                name: "Player",
                health: {
                    value: 5,
                    max: 10,
                },
                mana: {
                    value: 0,
                    max: 0,
                },
                skills: ["basic_attack"],
            });
            setStateStore("activeParty", [MainCharacterPartyUnitID]);

            RESOURCES.forEach(resource => {
                setStateStore("resources", resource.id, {
                    visible: stateApi.computeVisibility(resource.id),
                    value: resource.baseValue,
                    max: resource.baseMax,
                });
            });
            ACTIONS.forEach(action => {
                setStateStore("actions", action.id, {
                    visible: stateApi.computeVisibility(action.id),
                    executions: 0,
                });
            });
        },
        computeVisibility: (id: ResourceID | ActionID) => {
            const visible = checkVisibility(stateStore, id);
            if (id in RESOURCE_CONFIG_MAP) {
                setStateStore("resources", id, {
                    visible: visible,
                });
            }
            if (id in ACTION_CONFIG_MAP) {
                setStateStore("actions", id, {
                    visible: visible,
                });
            }
            return visible;
        },
        computeEnabled: (id: ResourceID | ActionID) => {
            return checkEnabled(stateStore, id);
        },
        applyGlobalEffects: function (effects: GlobalEffectConfig[]) {
            effects.forEach(effect => {
                stateApi.applyGlobalEffect(effect);
            });
        },
        applyGlobalEffect: function (effect: GlobalEffectConfig) {
            applyGlobalEffect(stateStore, setStateStore, stateApi, effect);
        },
        applyUnitEffects: function (effects: UnitEffect[]) {
            effects.forEach(effect => {
                stateApi.applyUnitEffect(effect);
            });
        },
        applyUnitEffect: function (effect: UnitEffect) {
            applyUnitEffect(stateStore, setStateStore, stateApi, effect);
        },
        doAction: (action: ActionConfig) => {
            doAction(stateStore, setStateStore, stateApi, action);
        },
        addLog: (log: string) => {
            setStateStore("logs", (current) => {
                return [...current, log];
            });
        },
        runEncounter: (delta: number) => {
            runEncounter(stateStore, setStateStore, stateApi, delta);
        },
        setTheme: (theme: ThemeID) => {
            setStateStore("theme", theme);
        }
    }
    return [
        stateStore,
        stateApi,
    ];
}

function checkVisibility(state: State, id: ResourceID | ActionID): boolean {
    if (id in RESOURCE_CONFIG_MAP) {
        let visible = false;
        if (id in state.resources) {
            visible = state.resources[id].visible;
        }
        return visible || checkEnabled(state, id);
    }
    if (id in ACTION_CONFIG_MAP) {
        let visible = false;
        if (id in state.actions) {
            visible = state.actions[id].visible;
        }
        return visible || checkEnabled(state, id);
    }
    return false;
}

function checkEnabled(state: State, id: ResourceID | ActionID): boolean {
    let prerequisites: Prerequisite[] = [];
    if (id in ACTION_CONFIG_MAP) {
        prerequisites = ACTION_CONFIG_MAP[id].prerequisites;
    }
    let enabled = false;
    if (!prerequisites || prerequisites.length === 0) {
        enabled = true;
    } else {
        enabled = prerequisites.every(prereq => {
            if (prereq.resourceID) {
                const res = state.resources[prereq.resourceID];
                if (!res) return false;

                if (prereq.minValue !== undefined && res.value < prereq.minValue) return false;
                if (prereq.maxValue !== undefined && res.value > prereq.maxValue) return false;
                if (prereq.minMax !== undefined && res.max < prereq.minMax) return false;
                if (prereq.maxMax !== undefined && res.max > prereq.maxMax) return false;

                if (prereq.valueLessThanMax && res.value >= res.max) return false;
                if (prereq.valueGreaterThanZero && res.value <= 0) return false;
                if (prereq.valueEqualToMax && res.value !== res.max) return false;
            }
            if (prereq.actionID) {
                const act = state.actions[prereq.actionID];
                if (!act) return false;
                console.log("act state: visible =" + act.visible + ", executions = " + act.executions);
                if (prereq.actionMinExecutions !== undefined && act.executions < prereq.actionMinExecutions) return false;
                if (prereq.actionMaxExecutions !== undefined && act.executions > prereq.actionMaxExecutions) return false;
            }

            if (prereq.unit && prereq.unitStat && prereq.unit === "mainCharacter") {
                const member = state.party[MainCharacterPartyUnitID];
                if (!member) return false;

                if (prereq.unitStat === "health") {
                    if (prereq.minValue !== undefined && member.health.value < prereq.minValue) return false;
                    if (prereq.maxValue !== undefined && member.health.value > prereq.maxValue) return false;
                    if (prereq.minMax !== undefined && member.health.max < prereq.minMax) return false;
                    if (prereq.maxMax !== undefined && member.health.max > prereq.maxMax) return false;
                }
                if (prereq.unitStat === "mana") {
                    if (prereq.minValue !== undefined && member.mana.value < prereq.minValue) return false;
                    if (prereq.maxValue !== undefined && member.mana.value > prereq.maxValue) return false;
                    if (prereq.minMax !== undefined && member.mana.max < prereq.minMax) return false;
                    if (prereq.maxMax !== undefined && member.mana.max > prereq.maxMax) return false;
                }
            }
            // TODO: Handle other unit prereqs.

            return true;
        });
    }
    if (id in state.actions) {
        if (ACTION_CONFIG_MAP[id].maxExecutions && state.actions[id].executions >= ACTION_CONFIG_MAP[id].maxExecutions) {
            enabled = false;
        }
    }
    return enabled;
}

function applyGlobalEffect(state: State, setStateStore: SetStoreFunction<State>, stateApi: StateApi, effect: GlobalEffectConfig) {
    switch (effect.type) {
        case "increase_value":
            console.log("increase_value");
            if (effect.resourceID) {
                stateApi.addLog("Increase value" + " " + effect.resourceID + " " + effect.amount);
                if (effect.chance !== undefined && Math.random() > effect.chance) return;
                setStateStore("resources", effect.resourceID, (current) => {
                    const prev = current || { value: 0, max: 0 };
                    const value = clamp(prev.value + (effect.amount || 0), 0, prev.max);
                    return { ...prev, value: value };
                });
            }
            if (effect.itemID) {
                stateApi.addLog("Increase value" + " " + effect.itemID + " " + effect.amount);
                if (effect.chance !== undefined && Math.random() > effect.chance) return;
                setStateStore("items", effect.itemID, (current) => {
                    const prev = current || { amount: 0 };
                    const amount = prev.amount + (effect.amount || 0);
                    return { ...prev, amount: amount };
                });
            }
            break;
        case "increase_max":
            console.log("increase_max");
            if (effect.resourceID) {
                stateApi.addLog("Increase max" + " " + effect.resourceID + " " + effect.amount);
                setStateStore("resources", effect.resourceID, (current) => {
                    console.log(current);
                    const prev = current || { value: 0, max: 0 };
                    const max = prev.max + (effect.amount || 0);
                    const value = clamp(prev.value, 0, max);
                    return { ...prev, max: max, value: value };
                });
            }
            break;
        case "start_encounter":
            if (state.party[MainCharacterPartyUnitID].health.value <= 0) {
                stateApi.addLog("Cannot start encounter with 0 health.");
                return;
            }
            stateApi.addLog("Start encounter");
            const encounterID = effect.encounterID;
            if (!encounterID) {
                console.log('no encounter id found');
                return;
            }
            const encounter = ENCOUNTER_CONFIG_MAP[encounterID];
            console.log(encounter);
            if (!encounter) {
                console.log('no encounter found');
                return;
            }
            let encounterState: EncounterState = {
                encounterID: encounterID,
                currentEnemyIndex: 0,
                allies: state.activeParty.reduce((acc, id) => {
                    acc[id] = { delay: 0 };
                    return acc;
                }, {} as Record<PartyUnitID, AllyCombatState>),
                enemies: [],
            };
            console.log(encounterState);
            setStateStore("encounter", encounterState);
            break;
    }
}

function applyUnitEffect(state: State, setStateStore: SetStoreFunction<State>, stateApi: StateApi, effect: UnitEffect) {
    const config = effect.config;
    const options = effect.options;
    console.log("applyUnitEffectConfig: " + JSON.stringify(config));
    console.log("applyUnitEffectOptions: " + JSON.stringify(options));

    if (config.type === "increase_value") {
        if (config.target === "mainCharacter") {
            if (config.stat === "health") {
                setStateStore("party", MainCharacterPartyUnitID, "health", (current) => {
                    const prev = current || { value: 0, max: 0 };
                    const value = clamp(prev.value + (config.amount || 0), 0, prev.max);
                    return { ...prev, value: value };
                });
            }
            if (config.stat === "mana") {
                setStateStore("party", MainCharacterPartyUnitID, "mana", (current) => {
                    const prev = current || { value: 0, max: 0 };
                    const value = clamp(prev.value + (config.amount || 0), 0, prev.max);
                    return { ...prev, value: value };
                });
            }
        }
    }
    if (config.type === "increase_max") {
        if (config.target === "mainCharacter") {
            if (config.stat === "health") {
                setStateStore("party", MainCharacterPartyUnitID, "health", (current) => {
                    const prev = current || { value: 0, max: 0 };
                    const max = prev.max + (config.amount || 0);
                    const value = clamp(prev.value, 0, max);
                    return { ...prev, max: max, value: value };
                });
            }
            if (config.stat === "mana") {
                setStateStore("party", MainCharacterPartyUnitID, "mana", (current) => {
                    const prev = current || { value: 0, max: 0 };
                    const max = prev.max + (config.amount || 0);
                    const value = clamp(prev.value, 0, max);
                    return { ...prev, max: max, value: value };
                });
            }
        }
    }
    if (config.type === "damage") {
        if (config.target === "mainCharacter") {
            setStateStore("party", MainCharacterPartyUnitID, "health", "value", (current) => {
                return clamp(current - (config.amount || 0), 0, state.party[MainCharacterPartyUnitID].health.max);
            });
        }
        if (options.targetAllyPartyUnitIDs) {
            options.targetAllyPartyUnitIDs.forEach((partyUnitID) => {
                setStateStore("party", partyUnitID, "health", "value", (current) => {
                    const unit = state.party[partyUnitID];
                    if (!unit) return current;
                    return clamp(current - (config.amount || 0), 0, unit.health.max);
                });
            })
        }
        if (options.targetEnemyPartyUnitIDs) {
            options.targetEnemyPartyUnitIDs.forEach((enemyIndex) => {
                setStateStore("encounter", "enemies", enemyIndex, "health", "value", (current) => {
                    const enemy = state.encounter?.enemies[enemyIndex];
                    if (!enemy) return current;
                    return clamp(current - (config.amount || 0), 0, enemy.health.max);
                });
            })
        }
    }
}

function doAction(state: State, setStateStore: SetStoreFunction<State>, stateApi: StateApi, action: ActionConfig) {
    if (state.encounter !== null) {
        stateApi.addLog("Cannot perform another action while in an encounter.");
        return;
    }
    if (!state.actions[action.id]) {
        setStateStore("actions", action.id, {
            executions: 0,
        });
    }
    if (action.maxExecutions && state.actions[action.id].executions >= action.maxExecutions) {
        console.log("Action already executed max times");
        return;
    }
    if (!checkEnabled(state, action.id)) {
        console.log("Prerequisites not met");
        return;
    }
    setStateStore("actions", action.id, (current) => {
        return { ...current, executions: current.executions + 1 };
    });
    stateApi.applyGlobalEffects(action.globalEffects);
    stateApi.applyUnitEffects(action.unitEffects.map((effect) => { return { config: effect, options: {} } }));
}

function encounterCompleted(state: State): boolean {
    if (state.encounter === null) {
        return false;
    }
    const encounterConfig = ENCOUNTER_CONFIG_MAP[state.encounter.encounterID];
    if (!encounterConfig) {
        return false;
    }
    return state.encounter.currentEnemyIndex >= encounterConfig.numberOfEnemies;
}

function encounterFailed(state: State): boolean {
    if (state.encounter === null) {
        return false;
    }
    return state.activeParty.every((unitID) => {
        return state.party[unitID].health.value <= 0;
    });
}

function spawnEnemy(state: State, setStateStore: SetStoreFunction<State>, stateApi: StateApi) {
    if (state.encounter === null) {
        return;
    }

    if (state.encounter.enemies.length > 0) {
        return;
    }

    const encounterConfig = ENCOUNTER_CONFIG_MAP[state.encounter.encounterID];
    if (!encounterConfig || state.encounter.currentEnemyIndex >= encounterConfig.numberOfEnemies) {
        return;
    }

    let enemyID = "";
    if (encounterConfig.order == "random") {
        enemyID = encounterConfig.enemies[Math.floor(Math.random() * encounterConfig.enemies.length)];
    } else if (encounterConfig.order == "sequential") {
        enemyID = encounterConfig.enemies[state.encounter.currentEnemyIndex];
    }

    const enemyConfig = ENEMY_CONFIG_MAP[enemyID];
    const enemyState: EnemyCombatState = {
        enemyID: enemyConfig.id,
        health: {
            value: enemyConfig.health,
            max: enemyConfig.health,
        },
        mana: {
            value: enemyConfig.mana,
            max: enemyConfig.mana,
        },
        delay: 0,
    };
    setStateStore("encounter", "enemies", [enemyState]);
    if (encounterConfig.order == "random") {
        stateApi.addLog("Enemy spawned: " + enemyConfig.name);
    }
}

function despawnEnemy(state: State, setStateStore: SetStoreFunction<State>) {
    if (state.encounter === null || state.encounter.enemies.length === 0) {
        return;
    }
    if (state.encounter.enemies[0].health.value <= 0) {
        setStateStore("encounter", "enemies", []);
        setStateStore("encounter", "currentEnemyIndex", (current) => current + 1);
    }
}

const baseTurnDelay = 2

function runEncounter(state: State, setStateStore: SetStoreFunction<State>, stateApi: StateApi, delta: number) {
    if (state.encounter === null) {
        return;
    }

    // 1. Spawn enemy if needed.
    spawnEnemy(state, setStateStore, stateApi);

    if (state.encounter.enemies.length === 0) {
        return;
    }

    // 2. Select Skills
    // Allies
    Object.entries(state.encounter.allies).forEach(([allyID, allyCombatState]) => {
        if (allyCombatState.skillID === undefined) {
            const unit = state.party[allyID];
            if (!unit) return;
            const skillID = unit.skills[Math.floor(Math.random() * unit.skills.length)];
            setStateStore("encounter", "allies", allyID, "skillID", skillID);
        }
    });
    // Enemies
    state.encounter.enemies.forEach((enemy, eIndex) => {
        if (enemy.skillID === undefined) {
            const enemyConfig = ENEMY_CONFIG_MAP[enemy.enemyID];
            const skillID = enemyConfig.skills[Math.floor(Math.random() * enemyConfig.skills.length)];
            setStateStore("encounter", "enemies", eIndex, "skillID", skillID);
        }
    });

    // 3. Update Delays
    Object.keys(state.encounter.allies).forEach((allyID) => {
        setStateStore("encounter", "allies", allyID, "delay", (d) => (d || 0) + delta);
    });
    state.encounter.enemies.forEach((_, eIndex) => {
        setStateStore("encounter", "enemies", eIndex, "delay", (d) => (d || 0) + delta);
    });

    // 4. Execution Check
    // Allies
    Object.entries(state.encounter.allies).forEach(([allyID, allyCombatState]) => {
        const skillID = allyCombatState.skillID;
        if (!skillID) return;

        const skill = SKILL_CONFIG_MAP[skillID];
        if (allyCombatState.delay >= skill.delay) {
            // Player/Ally Action
            skill.unitEffects.forEach((effect) => {
                let options: UnitEffectOptions = {
                    allyPartyUnitID: allyID,
                }
                if (effect.target == "enemy") {
                    const enemyIndex = Math.floor(Math.random() * state.encounter!.enemies.length);
                    options.targetEnemyPartyUnitIDs = [enemyIndex];
                }
                if (effect.target == "enemies") {
                    options.targetEnemyPartyUnitIDs = state.encounter!.enemies.map((_, i) => i);
                }
                if (effect.target == "ally") {
                    const allyIDs = Object.keys(state.encounter!.allies);
                    const targetAllyID = allyIDs[Math.floor(Math.random() * allyIDs.length)];
                    options.targetAllyPartyUnitIDs = [targetAllyID];
                }
                if (effect.target == "allies") {
                    options.targetAllyPartyUnitIDs = Object.keys(state.encounter!.allies);
                }
                if (effect.target == "all") {
                    options.targetAllyPartyUnitIDs = Object.keys(state.encounter!.allies);
                    options.targetEnemyPartyUnitIDs = state.encounter!.enemies.map((_, i) => i);
                }
                stateApi.applyUnitEffect({ config: effect, options: options })
            });

            setStateStore("encounter", "allies", allyID, "delay", d => (d || 0) - skill.delay);
            setStateStore("encounter", "allies", allyID, "skillID", undefined);

            despawnEnemy(state, setStateStore);
        }
    });

    // Enemies
    state.encounter.enemies.forEach((enemy, eIndex) => {
        const skillID = enemy.skillID;
        if (!skillID) return;

        const skill = SKILL_CONFIG_MAP[skillID];
        if (enemy.delay >= skill.delay) {
            skill.unitEffects.forEach((effect) => {
                let options: UnitEffectOptions = {
                    enemyPartyUnitID: eIndex,
                }
                if (effect.target == "ally") {
                    const enemyIndex = Math.floor(Math.random() * state.encounter!.enemies.length);
                    options.targetEnemyPartyUnitIDs = [enemyIndex]; // This looks like it was confusing ally/enemy targets
                }
                if (effect.target == "allies") {
                    options.targetEnemyPartyUnitIDs = state.encounter!.enemies.map((_, i) => i);
                }
                if (effect.target == "enemy") {
                    const allyIDs = Object.keys(state.encounter!.allies);
                    const targetAllyID = allyIDs[Math.floor(Math.random() * allyIDs.length)];
                    options.targetAllyPartyUnitIDs = [targetAllyID];
                }
                if (effect.target == "enemies") {
                    options.targetAllyPartyUnitIDs = Object.keys(state.encounter!.allies);
                }
                if (effect.target == "all") {
                    options.targetAllyPartyUnitIDs = Object.keys(state.encounter!.allies);
                    options.targetEnemyPartyUnitIDs = state.encounter!.enemies.map((_, i) => i);
                }
                stateApi.applyUnitEffect({ config: effect, options: options })
            });
            setStateStore("encounter", "enemies", eIndex, "delay", d => (d || 0) - skill.delay);
            setStateStore("encounter", "enemies", eIndex, "skillID", undefined);
        }
    });

    const encounterConfig = ENCOUNTER_CONFIG_MAP[state.encounter.encounterID];
    if (encounterCompleted(state)) {
        stateApi.applyGlobalEffects(encounterConfig.globalCompletionEffects);
        stateApi.applyUnitEffects(encounterConfig.unitCompletionEffects.map((effect) => { return { config: effect, options: {} } }));
        if (!encounterConfig.globalCompletionEffects.some(effect => effect.type === "start_encounter")) {
            setStateStore("encounter", null);
        }
        stateApi.addLog("Encounter completed");
        return;
    }
    if (encounterFailed(state)) {
        stateApi.applyGlobalEffects(encounterConfig.globalFailureEffects);
        stateApi.applyUnitEffects(encounterConfig.unitFailureEffects.map((effect) => { return { config: effect, options: {} } }));
        setStateStore("encounter", null);
        stateApi.addLog("Encounter failed");
        return;
    }
}
