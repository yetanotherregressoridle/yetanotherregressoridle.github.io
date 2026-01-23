import { Component } from 'solid-js';
import { useState } from '../stateContext';
import { ThemeID } from '../types';

const ThemeSelector: Component = () => {
    const [state, stateApi] = useState();

    return (
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <label for="theme-select">Theme:</label>
            <select
                id="theme-select"
                value={state.theme}
                onInput={(e) => stateApi.setTheme(e.currentTarget.value as ThemeID)}
                style="padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--section-bg); color: var(--text-color); cursor: pointer;"
            >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </div>
    );
};

export default ThemeSelector;
