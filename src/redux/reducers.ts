import { UPDATE_QUERY } from "./actionTypes";
import { IUpdateQueryResult } from "./actions";

export interface IQueriesResult {
  [id: string]: any;
}

export interface IMoonStore {
  queriesResult: IQueriesResult;
}

export interface IAppWithMoonStore extends IMoonStore {
  [key: string]: any;
}

export const queriesResultReducer = (state = {}, action: IUpdateQueryResult) => {
  switch (action.type) {
    case UPDATE_QUERY:
      return { ...state, [action.queryId]: action.payload };

    default:
      return state;
  }
};

export default {
  queriesResult: queriesResultReducer
};
