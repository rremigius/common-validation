import Log from 'log-control';
declare const log: Log;
export declare type Class = {
    name: string;
    new (...args: any[]): {};
};
/**
 * Can be used as identifier for alphanumeric type.
 */
export declare class Alphanumeric {
}
export declare type validator = (x: unknown) => boolean;
export declare type primitive = string | boolean | number;
export declare type alphanumeric = string | number;
export { log };
export declare class ValidationError extends Error {
    static getMessage(value: unknown, expectedType: string, name?: string): string;
    constructor(value: unknown, expectedType: string, name?: string);
}
/**
 * Set a validator for a given type. This validator can then be used from `checkType` with the specified type name.
 * @param {string} type			The name of the type.
 * @param {validator} validator	Validator function.
 * @param {string} [name]		Optional name. Will be displayed in the error messages instead of the type name.
 */
export declare function setValidator(type: string, validator: validator, name?: string): void;
export declare function check<T>(value: unknown, validator: (x: unknown) => boolean, expected: string, name?: string, options?: {
    defaultValue?: T | ((x: unknown) => T);
    warnIf?: (x: unknown) => boolean;
}): T;
/**
 * @deprecated Succeeded by `check`
 *
 * Checks the type of the given value. Throws an error if the type is not correct, and a default is not provided.
 * @param value
 * @param {string} type			A predefined type.
 * @param {string} name			The name of the variable. Will be used for error/warning messages.
 * @param [defaultValue]		The default to use in case the value did not match the type.
 * @param {validator} [warnIf]	If a default value is applied, a warning will be issued if this function returns `true`.
 * 								Input of the function is the value. As default behaviour, warnings will not be issued
 * 								if the invalid value was `undefined` or `null`.
 */
export declare function checkType(value: unknown, type: string, name: string, defaultValue?: unknown, warnIf?: (x: unknown) => boolean): unknown;
/**
 * Checks if a value is a number or a string.
 * @param value
 * @return {boolean}
 */
export declare function isAlphanumeric(value: unknown): boolean;
/**
 * Attempts to parse the given value as a number. Returns `null` if not possible, or if parsed number is different from
 * the input string (e.g. leading zero was removed in the process).
 * @param {number} value
 * @return {number|null}
 */
export declare function parseNumberStrict(value: unknown): number | null;
/**
 * Checks if a value is a primitive (string/number/boolean).
 * @param value
 * @return {boolean}
 */
export declare function isPrimitive(value: unknown): value is primitive;
/**
 * Checks if a value is a class (or function).
 * @param variable
 * @return {boolean}
 */
export declare function isClass(variable: unknown): variable is Class;
/**
 * Checks if a value is a subclass of the given parent class.
 * @param value
 * @param {Class} Parent
 * @param {boolean} [includeIdentity]	Determines whether Parent itself should be considered a sub-class (defaults to true).
 * @return {boolean}
 */
export declare function isSubClass(value: unknown, Parent: Class, includeIdentity?: boolean): value is Class;
/**
 * Returns a validator function that checks if its argument is a subclass of the given parent class.
 * @param {Class} Parent
 * @param {boolean} [includeIdentity]	Determines whether Parent itself should be considered a sub-class (defaults to true).
 * @return {validator}
 */
export declare function subClass(Parent: Class, includeIdentity?: boolean): (value: unknown) => boolean;
/**
 * Returns a validator function that checks if its argument is an instance of the given class.
 * @param {Class} Class
 */
export declare function instanceOf(Class: Class): (value: unknown) => boolean;
