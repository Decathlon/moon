/* eslint-disable import/prefer-default-export */

export const isServer = typeof window === "undefined";

const hasOwn = Object.prototype.hasOwnProperty;

export const getId = (params: Record<string, unknown>): string => {
  return params.id !== undefined ? (params.id as string) : stableStringify(params);
};

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, stableStringifyReplacer).replace(/(\r\n|\n|\r| )/gm, "");
}

export function equal(objA: unknown, objB: unknown, deep = false): boolean {
  if (is(objA, objB)) return true;

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;
  const a = objA as Record<string, unknown>;
  const b = objB as Record<string, unknown>;
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(b, keysA[i]) || !compare(a[keysA[i]], b[keysA[i]], deep)) {
      return false;
    }
  }

  return true;
}

function compare(objA: unknown, objB: unknown, deep: boolean) {
  return deep ? equal(objA, objB, deep) : is(objA, objB);
}

function is(x: unknown, y: unknown) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / (x as number) === 1 / (y as number);
  }
  // eslint-disable-next-line no-self-compare
  return x !== x && y !== y;
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o: unknown): o is Record<string, unknown> {
  if (!hasObjectPrototype(o)) {
    return false;
  }

  // If has modified constructor
  const ctor = (o as { constructor?: unknown }).constructor;
  if (typeof ctor === "undefined") {
    return true;
  }

  // If has modified prototype
  const prot = (ctor as { prototype?: unknown }).prototype;
  if (!hasObjectPrototype(prot)) {
    return false;
  }

  // If constructor does not have an Object-specific method
  // eslint-disable-next-line no-prototype-builtins
  if (!(prot as Record<string, unknown>).hasOwnProperty || !Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf")) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

function hasObjectPrototype(o: unknown): boolean {
  return Object.prototype.toString.call(o) === "[object Object]";
}

// Adapted from: https://github.com/tannerlinsley/react-query/blob/master/src/core/utils.ts
function stableStringifyReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "function") {
    return "function";
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, string>>((result, key) => {
        result[key] = JSON.stringify(value[key], stableStringifyReplacer);
        return result;
      }, {});
  }

  return value;
}
