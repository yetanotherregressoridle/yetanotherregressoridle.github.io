import type { Component } from 'solid-js';
import styles from './Landing.module.css';

interface LandingProps {
    onStartGame: () => void;
}

const Landing: Component<LandingProps> = (props) => {
    return (
        <div class={styles.landing}>
            <div class={styles.content}>
                <h1 class={styles.title}>Yet Another Regressor Idle</h1>
                <p class={styles.description}>
                    This is a vibe-coded idle/incremental game that attempts to capture the feeling of being the main character of a regression manhwa, with <i>Leveling with the Gods</i> and <i>Max Level Player's 100th Regression</i> as the main sources of inspiration.
                </p>
                <p class={styles.subdescription}>
                    TODO:<br />
                    * No saving/persistence.
                </p>
                <button class={styles.startButton} onClick={props.onStartGame}>
                    <span class={styles.buttonText}>Start Game</span>
                    <span class={styles.buttonGlow}></span>
                </button>
            </div>
        </div>
    );
};

export default Landing;
