import type { Component } from 'solid-js';
import { Index, createMemo } from "solid-js";
import { useState } from "../stateContext";

const Inventory: Component = () => {
    const [state] = useState();
    const itemsList = createMemo(() => Object.entries(state.items));

    return (
        <div>
            <b>Inventory</b>
            <Index each={itemsList()}>
                {(item, index) =>
                (<div>
                    {item()[1].amount + " " + item()[1].id}
                </div>)
                }
            </Index>
        </div>
    )
}

export default Inventory;
