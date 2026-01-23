import type { Component, Accessor } from 'solid-js';
import { Show, createSignal, For } from "solid-js";
import styles from './Actions.module.css';
import { useState } from "../stateContext";
import { ActionConfig, Prerequisite } from "../types";

const Actions: Component<{ item: Accessor<ActionConfig> }> = (props) => {
    const [_, stateApi] = useState();
    const item = props.item;
    const [isExpanded, setIsExpanded] = createSignal(false);

    const formatPrerequisite = (prereq: Prerequisite): string => {
        const parts: string[] = [];

        if (prereq.resourceID) {
            parts.push(`Resource: ${prereq.resourceID}`);
            if (prereq.minValue !== undefined) parts.push(`min value: ${prereq.minValue}`);
            if (prereq.maxValue !== undefined) parts.push(`max value: ${prereq.maxValue}`);
            if (prereq.minMax !== undefined) parts.push(`min max: ${prereq.minMax}`);
            if (prereq.maxMax !== undefined) parts.push(`max max: ${prereq.maxMax}`);
            if (prereq.valueGreaterThanZero) parts.push(`value > 0`);
            if (prereq.valueLessThanMax) parts.push(`value < max`);
            if (prereq.valueEqualToMax) parts.push(`value = max`);
        }

        if (prereq.actionID) {
            parts.push(`Action: ${prereq.actionID}`);
            if (prereq.actionMinExecutions !== undefined) parts.push(`min executions: ${prereq.actionMinExecutions}`);
            if (prereq.actionMaxExecutions !== undefined) parts.push(`max executions: ${prereq.actionMaxExecutions}`);
        }

        if (prereq.unit) {
            parts.push(`Unit: ${prereq.unit}`);
            if (prereq.unitStat) parts.push(`stat: ${prereq.unitStat}`);
        }

        return parts.join(', ');
    };

    const hasExpandableContent = () => {
        return item().flavorText || item().prerequisites.length > 0;
    };

    return (
        <Show when={stateApi.computeVisibility(item().id)}>
            <div class={styles.actionContainer}>
                <button
                    class={styles.action}
                    onClick={() => stateApi.doAction(item())}
                    disabled={!stateApi.computeEnabled(item().id)}>
                    <div class={styles.actionContent}>
                        <div class={styles.actionHeader}>
                            <span>{item().name}</span>
                            <Show when={hasExpandableContent()}>
                                <button
                                    class={styles.toggleButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExpanded(!isExpanded());
                                    }}
                                    aria-label="Toggle details"
                                    type="button">
                                    {isExpanded() ? '▼' : '▶'}
                                </button>
                            </Show>
                        </div>
                        <hr />
                        {item().description}

                        <Show when={isExpanded()}>
                            <div class={styles.expandedDetails}>
                                <Show when={item().flavorText}>
                                    <p class={styles.flavorText}>{item().flavorText}</p>
                                </Show>
                                <Show when={item().prerequisites.length > 0}>
                                    <div class={styles.prerequisites}>
                                        <strong>Prerequisites:</strong>
                                        <ul>
                                            <For each={item().prerequisites}>
                                                {(prereq) => <li>{formatPrerequisite(prereq)}</li>}
                                            </For>
                                        </ul>
                                    </div>
                                </Show>
                            </div>
                        </Show>
                    </div>
                </button>
            </div>
        </Show>
    )
}

export default Actions;
