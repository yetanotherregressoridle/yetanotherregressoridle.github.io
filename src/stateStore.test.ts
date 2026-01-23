import { describe, it, expect } from 'vitest';
import { createStateStore } from './stateStore';
import { ACTION_CONFIG_MAP, ENCOUNTER_CONFIG_MAP } from './base';
import { MainCharacterPartyUnitID } from './types';

describe('stateStore with real data', () => {

    it('initializes state with real resources', () => {
        const [state, api] = createStateStore();
        api.initialize(api);

        // Check for 'days' resource from resources.ts
        // Base value is 99, max is 100
        expect(state.resources['days']).toBeDefined();
        expect(state.resources['days'].value).toBe(95);
        expect(state.resources['days'].max).toBe(100);

        // Check for 'health' resource
        // Base value 5, max 10
        expect(state.party[MainCharacterPartyUnitID].health).toBeDefined();
        expect(state.party[MainCharacterPartyUnitID].health.value).toBe(5);
        expect(state.party[MainCharacterPartyUnitID].health.max).toBe(10);
    });

    it('computes visibility and enabled state correctly', () => {
        const [state, api] = createStateStore();
        api.initialize(api);

        // 'survive' action: 
        // Prereq: days valueLessThanMax (99 < 100 is true).
        expect(api.computeEnabled('survive')).toBe(true);

        // 'awaken' action: 
        // Prereq: days valueEqualToMax (99 == 100 is false).
        // Prereq: mana maxMax 0 (mana max is 0 -> true).
        // Should be disabled/not enabled.
        expect(api.computeEnabled('awaken')).toBe(false);
    });

    it('performs "survive" action and unlocks "awaken"', () => {
        const [state, api] = createStateStore();
        api.initialize(api);

        // Verify initial state
        expect(state.resources['days'].value).toBe(95);
        expect(state.actions['survive']?.executions || 0).toBe(0);

        // Perform 'survive'
        // This adds +1 to days (becoming 96)
        const surviveAction = ACTION_CONFIG_MAP['survive'];
        api.doAction(surviveAction);

        // Verify executions increased
        expect(state.actions['survive'].executions).toBe(1);

        // Verify 'days' increased to 96
        expect(state.resources['days'].value).toBe(96);

        // Now 'awaken' should be enabled because days (96) !== max (100)
        expect(api.computeEnabled('awaken')).toBe(false);

        // Perform 'survive'
        // This adds +1 to days 4x (becoming 100)
        api.doAction(surviveAction);
        api.doAction(surviveAction);
        api.doAction(surviveAction);
        api.doAction(surviveAction);

        // Now 'awaken' should be enabled because days (100) == max (100)
        expect(api.computeEnabled('awaken')).toBe(true);
    });

    it('performs "awaken" action and modifies mana stat', () => {
        const [state, api] = createStateStore();
        api.initialize(api);

        // We need to trigger "survive" first to max out days (99->100) so "awaken" becomes enabled
        const surviveAction = ACTION_CONFIG_MAP['survive'];
        api.doAction(surviveAction);
        api.doAction(surviveAction);
        api.doAction(surviveAction);
        api.doAction(surviveAction);
        api.doAction(surviveAction);
        expect(state.resources['days'].value).toBe(100);

        // Now perform "awaken"
        // Effect: increase mana max by 1
        const awakenAction = ACTION_CONFIG_MAP['awaken'];
        api.doAction(awakenAction);

        expect(state.party[MainCharacterPartyUnitID].mana.max).toBe(1);

        // Awaken has maxExecutions: 1. Try doing it again.
        api.doAction(awakenAction);
        // executions should stay at 1 (if logic prevents it) or just fail prereq if logic is separate
        // store check: if (action.maxExecutions && state.actions[action.id].executions >= action.maxExecutions) return
        expect(state.actions['awaken'].executions).toBe(1);
    });

    it('starts combat encounter with "battle"', () => {
        const [state, api] = createStateStore();
        api.initialize(api);

        // 'battle' prereq: days valueLessThanMax (99 < 100 -> true)
        // So checking battle is possible initially
        const battleAction = ACTION_CONFIG_MAP['battle'];

        // Perform battle
        api.doAction(battleAction);

        // Should have started encounter 'first'
        expect(state.encounter).not.toBeNull();
        expect(state.encounter?.encounterID).toBe('first');

        // Verify encounter details (Slime should be spawned or at least encounter structure ready)
        // The start_encounter effect initializes the encounter state.
        // Spawn happens in runEncounter usually, or if immediate spawn logic exists.
        // Looking at logic: doAction -> applyEffects -> start_encounter
        // Initial encounter state has currentEnemyIndex: 0, enemy: null.
        // Enemy spawning happens in runEncounter loop.

        expect(state.encounter).not.toBeNull();
        if (state.encounter) {
            expect(state.encounter.currentEnemyIndex).toBe(0);
            expect(state.encounter.enemies.length).toBe(0);
            expect(Object.keys(state.encounter.allies).length).toBe(1);
            expect(state.encounter.allies[MainCharacterPartyUnitID]).toBeDefined();
        }
    });

    it('runs through a full encounter', () => {
        const [state, api] = createStateStore();
        api.initialize(api);

        // Start battle
        const battleAction = ACTION_CONFIG_MAP['battle'];
        api.doAction(battleAction);

        // Run for 8 seconds (16 iterations of 0.5s)
        for (let i = 0; i < 16; i++) {
            api.runEncounter(0.5);
        }

        // Verify state at 8 seconds
        expect(state.party[MainCharacterPartyUnitID].health.value).toBe(1);

        if (state.encounter?.enemies.length! > 0) {
            expect(state.encounter!.enemies[0].health.value).toBeCloseTo(4.6);
        } else {
            throw new Error("Enemy should still be alive at 8s");
        }

        let iterations = 0;
        const maxIterations = 100;

        // Finish the encounter
        while (state.encounter !== null && iterations < maxIterations) {
            api.runEncounter(0.5);
            iterations++;
        }

        expect(state.encounter).toBeNull();
        expect(iterations).toBeLessThan(maxIterations);
    });
});
