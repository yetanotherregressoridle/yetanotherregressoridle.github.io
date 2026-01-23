/* @refresh reload */
import { createContext, useContext } from "solid-js";
import { createStateStore, StateStore } from "./stateStore";

export const StateContext = createContext<StateStore>(undefined);

export function StateProvider(props: { children: any }) {
    const stateStore = createStateStore();
    return (
        <StateContext.Provider value={stateStore}>
            {props.children}
        </StateContext.Provider>
    );
}

export function useState() {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error("useState must be used within a StateProvider")
    }
    return context;
}