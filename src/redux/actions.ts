import { UPDATE_QUERY } from "./actionTypes";

export interface IUpdateQueryResult {
  type: UPDATE_QUERY;
  queryId: string;
  payload: any;
}

export const updateQueryResult = (queryId: string, payload: any): IUpdateQueryResult => ({
  type: UPDATE_QUERY,
  queryId,
  payload
});
