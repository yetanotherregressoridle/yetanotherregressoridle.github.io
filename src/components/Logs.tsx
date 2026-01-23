import type { Component } from 'solid-js';
import { Index } from "solid-js";
import styles from './Logs.module.css';
import { useState } from "../stateContext";

const Logs: Component = () => {
    const [state] = useState();

    const logDateFormatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    return (
        <div class={styles.log_content}>
            <Index each={state.logs}>
                {(item, index) =>
                (<div>
                    {"[" + logDateFormatter.format(Date.now()) + "] " + item()}
                </div>)
                }
            </Index>
        </div>
    )
}

export default Logs;
