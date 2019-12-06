import { createStore, combineReducers, Action, Store } from "redux";

import reducer, { IMoonStore } from "./reducers";
import { Nullable } from "../typing";

let store: Nullable<Store<IMoonStore, Action<any>>> = null;

export function createMoonStore(initialState?: IMoonStore) {
  const reducers = combineReducers({
    ...reducer
  });

  store = createStore<IMoonStore, Action<any>, {}, {}>(reducers, initialState);

  return store;
}

export default function getMoonStore() {
  if (!store) {
    store = createMoonStore();
  }

  return store;
}
