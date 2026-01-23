import { Component } from 'solid-js';
import ThemeSelector from './ThemeSelector';

const Config: Component = () => {
    return (
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <h3>Configuration</h3>
            <section style="display: flex; flex-direction: column; gap: 10px; padding: 15px; border: 1px solid var(--border-color); background: var(--section-bg); border-radius: 8px;">
                <h4 style="margin: 0;">Appearance</h4>
                <ThemeSelector />
            </section>
        </div>
    );
};

export default Config;
