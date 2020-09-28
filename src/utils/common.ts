/* eslint-disable import/prefer-default-export */
import hash from "object-hash";

export const getQueryId = (id?: string, source?: string, endPoint?: string, variables?: any): string => {
  return id || hash([source, endPoint, variables]);
};
