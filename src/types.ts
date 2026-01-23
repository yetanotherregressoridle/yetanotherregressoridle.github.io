export type ResourceID = string;
export type CategoryID = string;
export type EncounterID = string;
export type EnemyID = string;
export type AllyID = string;
export type ActionID = string;
export type ItemID = string;
export type SkillID = string;
export type PartyUnitID = string;
export type EnemyPartyUnitID = number;

export const MainCharacterPartyUnitID = "player";
export type ThemeID = 'light' | 'dark' | 'system';

export interface CategoryConfig {
    id: CategoryID;
    name: string;
}

export interface Prerequisite {
    // Resource prerequisites
    resourceID?: ResourceID;
    minValue?: number;
    maxValue?: number;
    minMax?: number;
    maxMax?: number;
    valueGreaterThanZero?: boolean;
    valueLessThanMax?: boolean;
    valueEqualToMax?: boolean;
    // Action prerequisites
    actionID?: ActionID;
    actionMinExecutions?: number;
    actionMaxExecutions?: number;
    // Unit prerequisites
    unit?: 'mainCharacter' | 'enemy' | 'enemies' | 'ally' | 'allies' | 'all';
    unitStat?: 'health' | 'mana';
}

export interface ResourceConfig {
    id: ResourceID;
    name: string;
    type: 'basic' | 'stat'; // 'basic' = Left Col, 'stat' = Right Col
    category?: string; // Grouping for the UI (matches CategoryID usually)
    baseMax: number;
    baseValue: number;
    description: string;
}

export interface ResourceState {
    visible: boolean;
    value: number;
    max: number;
}

export interface EncounterConfig {
    id: EncounterID;
    name: string;
    type: 'combat' | 'other';
    category: CategoryID;
    // If 'random', enemies are selected at random from the list of enemies.
    // If 'sequential', enemies are selected in order of the list of enemies.
    order: 'random' | 'sequential';
    // Number of enemies to be selected before the encounter is complete.
    numberOfEnemies: number;
    enemies: EnemyID[];
    completionMessage: string;
    globalCompletionEffects: GlobalEffectConfig[];
    unitCompletionEffects: UnitEffectConfig[];
    failureMessage: string;
    globalFailureEffects: GlobalEffectConfig[];
    unitFailureEffects: UnitEffectConfig[];
}

export interface EncounterState {
    encounterID: EncounterID;
    currentEnemyIndex: number;
    allies: Record<PartyUnitID, AllyCombatState>;
    enemies: EnemyCombatState[];
}

export interface AllyCombatState {
    skillID?: SkillID;
    delay: number;
}

export interface EnemyCombatState {
    enemyID: EnemyID;
    health: ValueState;
    mana: ValueState;
    skillID?: SkillID;
    delay: number;
}

export interface ValueState {
    value: number;
    max: number;
}

export interface UnitState {
    id: string;
    name: string;
    health: ValueState;
    mana: ValueState;
}

export interface PartyUnitState extends UnitState {
    skills: SkillID[];
}

export interface UnitConfig {
    id: string;
    name: string;
    health: number;
    mana: number;
    skills: SkillID[];
}

export interface EnemyConfig extends UnitConfig {
    description: string;
    completionEffects: GlobalEffectConfig[];
}

export interface ActionConfig {
    id: ActionID;
    name: string;
    category: CategoryID;
    description: string;
    flavorText: string;
    globalEffects: GlobalEffectConfig[];
    unitEffects: UnitEffectConfig[];
    prerequisites: Prerequisite[];
    maxExecutions?: number;
}

export interface ActionState {
    visible: boolean;
    executions: number;
}

export interface GlobalEffectConfig {
    type: 'increase_value' | 'increase_max' | 'start_encounter' | 'end_encounter';
    amount?: number;
    actionID?: ActionID;
    resourceID?: ResourceID;
    encounterID?: EncounterID;
    itemID?: ItemID;

    chance?: number;
    hidden?: boolean;
}

export interface UnitEffectConfig {
    type: 'increase_value' | 'increase_max' | 'damage';
    target: 'mainCharacter' | 'ally' | 'allies' | 'enemy' | 'enemies' | 'all';
    stat: 'health' | 'mana';
    amount: number;
}

export interface UnitEffectOptions {
    // Source of the effect.
    allyPartyUnitID?: PartyUnitID;
    enemyPartyUnitID?: EnemyPartyUnitID;
    // Target of the effect.
    targetAllyPartyUnitIDs?: PartyUnitID[];
    targetEnemyPartyUnitIDs?: EnemyPartyUnitID[];
    stat?: 'health' | 'mana';
    amount?: number;
}

export interface UnitEffect {
    config: UnitEffectConfig;
    options: UnitEffectOptions;
}

export interface SkillConfig {
    id: SkillID;
    name: string;
    type: 'active' | 'passive';
    delay: number;
    costs: Cost[];
    globalEffects: GlobalEffectConfig[];
    unitEffects: UnitEffectConfig[];
}

export interface Cost {
    resourceID: ResourceID;
    amount: number;
}

export interface ItemConfig {
    id: ItemID;
    name: string;
    description: string;
    // slot: 'head' | 'body' | 'legs' | 'feet' | 'ring' | 'weapon' | 'shield' | 'accessory';
}

export interface ItemState {
    id: ItemID;
    amount: number;
}
