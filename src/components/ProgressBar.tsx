import { Component, Show } from 'solid-js';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number;
    max: number;
    label: string;
    type: 'health' | 'mana' | 'delay';
    easing?: number;
    isHealth?: boolean;
}

const ProgressBar: Component<ProgressBarProps> = (props) => {
    const ratio = () => props.max > 0 ? props.value / props.max : 0;
    const easing = () => props.easing ?? 1.0;

    // Calculate visual width based on easing power
    const visualWidth = () => Math.pow(ratio(), easing()) * 100;

    return (
        <div class={styles.progressBar}>
            <div
                class={`${styles.progressFill} ${styles[props.type]} ${props.isHealth ? styles.healthFill : ''}`}
                style={{ width: `${visualWidth()}%` }}
            />
            <div class={styles.barText}>
                {props.label}
            </div>
        </div>
    );
};

export default ProgressBar;
