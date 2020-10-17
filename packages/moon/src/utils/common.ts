/* eslint-disable import/prefer-default-export */

export const isServer = typeof window === "undefined";

const hasOwn = Object.prototype.hasOwnProperty;

export const getId = (params: Record<string, any>): string => {
  return params.id !== undefined ? params.id : stableStringify(params);
};

export function stableStringify(value: any): string {
  return JSON.stringify(value, stableStringifyReplacer).replace(/(\r\n|\n|\r| )/gm, "");
}

export function equal(objA: any, objB: any, deep = false): boolean {
  if (is(objA, objB)) return true;

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !compare(objA[keysA[i]], objB[keysA[i]], deep)) {
      return false;
    }
  }

  return true;
}

function compare(objA: any, objB: any, deep: boolean) {
  return deep ? equal(objA, objB, deep) : is(objA, objB);
}

function is(x: any, y: any) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  }
  return x !== x && y !== y;
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
// eslint-disable-next-line @typescript-eslint/ban-types
function isPlainObject(o: any): o is Object {
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

//Adapted from: https://github.com/tannerlinsley/react-query/blob/master/src/core/utils.ts
function stableStringifyReplacer(_key: string, value: any): unknown {
  if (typeof value === "function") {
    return "function";
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = JSON.stringify(value[key], stableStringifyReplacer);
        return result;
      }, {} as any);
  }

  return value;
}
