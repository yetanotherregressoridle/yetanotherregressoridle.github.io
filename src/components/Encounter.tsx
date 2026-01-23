import type { Component } from 'solid-js';
import { Show, For, createMemo } from "solid-js";
import styles from './Encounter.module.css';
import ProgressBar from './ProgressBar';
import { useState } from "../stateContext";
import { ENEMY_CONFIG_MAP, SKILL_CONFIG_MAP } from "../base";
import { formatNumber } from "../utils";

const Encounter: Component = () => {
    const [state] = useState();

    const alliesList = createMemo(() => Object.entries(state.encounter?.allies ?? {}));

    return (
        <div class={styles.encounter}>
            <b>Encounter</b>
            <Show when={state.encounter !== null}>
                <div style="border: 1px solid black; width: 360px; margin: 0 auto;">
                    <For each={state.encounter?.enemies}>
                        {(unit) => (
                            <div style="text-align: right;">
                                <div><b>{unit.enemyID}</b></div>
                                <ProgressBar
                                    value={unit.health.value}
                                    max={unit.health.max}
                                    label={`HP: ${formatNumber(unit.health.value)} / ${formatNumber(unit.health.max)}`}
                                    type="health"
                                    easing={0.7}
                                    isHealth={true}
                                />
                                <Show when={(unit.mana.max ?? 0) > 0}>
                                    <ProgressBar
                                        value={unit.mana.value}
                                        max={unit.mana.max}
                                        label={`MP: ${formatNumber(unit.mana.value)} / ${formatNumber(unit.mana.max)}`}
                                        type="mana"
                                    />
                                </Show>
                                <ProgressBar
                                    value={unit.delay}
                                    max={unit.skillID ? SKILL_CONFIG_MAP[unit.skillID].delay : 0}
                                    label={unit.skillID ? `${SKILL_CONFIG_MAP[unit.skillID].name}: ${formatNumber(unit.delay)} / ${formatNumber(SKILL_CONFIG_MAP[unit.skillID].delay)}` : 'Wait'}
                                    type="delay"
                                />
                            </div>
                        )}
                    </For>
                    <For each={alliesList()}>
                        {([allyID, unit]) => {
                            const ally = state.party[allyID];
                            return (
                                <div style="text-align: left;">
                                    <div><b>{ally.name}</b></div>
                                    <ProgressBar
                                        value={ally.health.value}
                                        max={ally.health.max}
                                        label={`HP: ${formatNumber(ally.health.value)} / ${formatNumber(ally.health.max)}`}
                                        type="health"
                                        easing={0.7}
                                        isHealth={true}
                                    />
                                    <Show when={(ally.mana.max ?? 0) > 0}>
                                        <ProgressBar
                                            value={ally.mana.value}
                                            max={ally.mana.max}
                                            label={`MP: ${formatNumber(ally.mana.value)} / ${formatNumber(ally.mana.max)}`}
                                            type="mana"
                                        />
                                    </Show>
                                    <ProgressBar
                                        value={unit.delay}
                                        max={unit.skillID ? SKILL_CONFIG_MAP[unit.skillID].delay : 0}
                                        label={unit.skillID ? `${SKILL_CONFIG_MAP[unit.skillID].name}: ${formatNumber(unit.delay)} / ${formatNumber(SKILL_CONFIG_MAP[unit.skillID].delay)}` : 'Wait'}
                                        type="delay"
                                    />
                                </div>
                            );
                        }}
                    </For>
                </div>
            </Show>
            <Show when={state.encounter === null}>
                <div>No encounter active.</div>
            </Show>
        </div>
    )
}

export default Encounter;
