import type { Component } from 'solid-js';
import { Index, Show, createMemo, onMount, onCleanup, createEffect, createSignal, Switch, Match } from "solid-js";
import styles from './App.module.css';

import { useState } from "./stateContext";

import { RESOURCE_CONFIG_MAP, ACTIONS } from "./base";
import { formatNumber } from "./utils";

import Actions from "./components/Actions";
import Encounter from "./components/Encounter";
import Inventory from "./components/Inventory";
import Logs from "./components/Logs";
import Config from "./components/Config";
import Landing from "./components/Landing";
import { MainCharacterPartyUnitID, ThemeID } from './types';

const Game: Component = () => {
    const [state, stateApi] = useState();
    const [activeTab, setActiveTab] = createSignal<'actions' | 'encounter' | 'inventory' | 'config'>('actions');

    // Swipe/drag state
    const [touchStartX, setTouchStartX] = createSignal<number | null>(null);
    const [touchStartY, setTouchStartY] = createSignal<number | null>(null);

    const tabs: ('actions' | 'encounter' | 'inventory' | 'config')[] = ['actions', 'encounter', 'inventory', 'config'];

    const switchToTab = (direction: 'left' | 'right') => {
        const currentIndex = tabs.indexOf(activeTab());
        if (direction === 'right' && currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
        } else if (direction === 'left' && currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
        const startX = touchStartX();
        const startY = touchStartY();

        if (startX === null || startY === null) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;

        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // Only trigger if horizontal swipe is more significant than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                switchToTab('right');
            } else {
                switchToTab('left');
            }
        }

        setTouchStartX(null);
        setTouchStartY(null);
    };

    createEffect(() => {
        let themeToApply: 'light' | 'dark' = 'dark'; // User want default to system dark mode

        if (state.theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            themeToApply = prefersDark ? 'dark' : 'light';
        } else {
            themeToApply = state.theme as 'light' | 'dark';
        }

        document.documentElement.setAttribute('data-theme', themeToApply);
    });

    onMount(() => {
        stateApi.initialize(stateApi);
        let currentTimestamp = Date.now() / 1000;
        const interval = setInterval(() => {
            let newTimestamp = Date.now() / 1000;
            const delta = newTimestamp - currentTimestamp;
            currentTimestamp = newTimestamp;
            stateApi.runEncounter(delta);
        }, 50);

        onCleanup(() => clearInterval(interval));
    });

    const resourcesList = createMemo(() => Object.entries(state.resources));

    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <span>Yet Another Regressor Idle</span>
            </header>
            <nav class={styles.tab_nav}>
                <button
                    class={`${styles.tab_button} ${activeTab() === 'actions' ? styles.tab_active : ''} `}
                    onClick={() => setActiveTab('actions')}
                >
                    Actions
                </button>
                <button
                    class={`${styles.tab_button} ${activeTab() === 'encounter' ? styles.tab_active : ''} `}
                    onClick={() => setActiveTab('encounter')}
                >
                    Encounter
                </button>
                <button
                    class={`${styles.tab_button} ${activeTab() === 'inventory' ? styles.tab_active : ''} `}
                    onClick={() => setActiveTab('inventory')}
                >
                    Inventory
                </button>
                <button
                    class={`${styles.tab_button} ${activeTab() === 'config' ? styles.tab_active : ''} `}
                    onClick={() => setActiveTab('config')}
                >
                    Config
                </button>
            </nav>
            <div class={styles.main_container}>
                <div
                    class={styles.tab_content}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <Switch>
                        <Match when={activeTab() === 'actions'}>
                            <b>Actions</b>
                            <Index each={ACTIONS}>
                                {(item) => <Actions item={item} />}
                            </Index>
                        </Match>
                        <Match when={activeTab() === 'encounter'}>
                            <Encounter />
                        </Match>
                        <Match when={activeTab() === 'inventory'}>
                            <Inventory />
                        </Match>
                        <Match when={activeTab() === 'config'}>
                            <Config />
                        </Match>
                    </Switch>
                </div>

                <Show when={activeTab() === 'actions' || activeTab() === 'encounter'}>
                    <div class={styles.logs}>
                        <Logs />
                    </div>
                </Show>

                <aside class={styles.stats}>
                    <b>Resources</b>
                    <Index each={resourcesList()}>
                        {(item) => (
                            <Show when={RESOURCE_CONFIG_MAP[item()[0]].type === "basic" && item()[1].max > 0}>
                                <div>
                                    {RESOURCE_CONFIG_MAP[item()[0]].name + " " + formatNumber(item()[1].value) + " / " + formatNumber(item()[1].max)}
                                </div>
                            </Show>
                        )}
                    </Index>
                    <br />
                    <b>Stats</b>
                    <Show when={state.party[MainCharacterPartyUnitID] && (state.party[MainCharacterPartyUnitID].health.max ?? 0) > 0}>
                        <div>
                            Health {formatNumber(state.party[MainCharacterPartyUnitID].health.value)} / {formatNumber(state.party[MainCharacterPartyUnitID].health.max)}
                        </div>
                    </Show>
                    <Show when={state.party[MainCharacterPartyUnitID] && (state.party[MainCharacterPartyUnitID].mana.max ?? 0) > 0}>
                        <div>
                            Mana {formatNumber(state.party[MainCharacterPartyUnitID].mana.value)} / {formatNumber(state.party[MainCharacterPartyUnitID].mana.max)}
                        </div>
                    </Show>
                </aside>
            </div>
        </div>
    );
};

const App: Component = () => {
    const [isGameStarted, setIsGameStarted] = createSignal(false);

    const handleStartGame = () => {
        setIsGameStarted(true);
    };

    return (
        <Show
            when={isGameStarted()}
            fallback={<Landing onStartGame={handleStartGame} />}
        >
            <Game />
        </Show>
    );
};

export default App;

