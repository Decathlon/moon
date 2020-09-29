/* eslint-disable import/prefer-default-export */
export const getQueryId = (id?: string, source?: string, endPoint?: string, variables?: any): string => {
  return id || stableStringify([source, endPoint, variables]);
};

//Copied from: https://github.com/tannerlinsley/react-query/blob/master/src/core/utils.ts
function stableStringifyReplacer(_key: string, value: any): unknown {
  if (typeof value === "function") {
    throw new Error();
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = value[key];
        return result;
      }, {} as any);
  }

  return value;
}

export function stableStringify(value: any): string {
  return JSON.stringify(value, stableStringifyReplacer);
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
// eslint-disable-next-line @typescript-eslint/ban-types
export function isPlainObject(o: any): o is Object {
  if (!hasObjectPrototype(o)) {
    return false;
  }

  // If has modified constructor
  const ctor = o.constructor;
  if (typeof ctor === "undefined") {
    return true;
  }

  // If has modified prototype
  const prot = ctor.prototype;
  if (!hasObjectPrototype(prot)) {
    return false;
  }

  // If constructor does not have an Object-specific method
  // eslint-disable-next-line no-prototype-builtins
  if (!prot.hasOwnProperty("isPrototypeOf")) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === "[object Object]";
}
