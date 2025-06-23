/**
 * Create an object composed of the picked object properties
 * @param object The source object
 * @param keys The keys to pick from the object
 * @returns A new object with only the picked properties
 */
const pick = <T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Partial<T> => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key]
    }
    return obj
  }, {} as Partial<T>)
}

export default pick
