import * as hash from "object-hash";

export const getQueryId = (id?: string, source?: string, endPoint?: string, variables?: any) => {
  return id || hash([source, endPoint, variables]);
};
