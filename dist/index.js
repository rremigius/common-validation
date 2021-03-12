"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceOf = exports.subClass = exports.isSubClass = exports.isClass = exports.isPrimitive = exports.parseNumberStrict = exports.isAlphanumeric = exports.checkType = exports.check = exports.setValidator = exports.ValidationError = exports.log = exports.Alphanumeric = void 0;
const lodash_1 = __importDefault(require("lodash"));
const log_control_1 = __importDefault(require("log-control"));
const log = log_control_1.default.instance("validation");
exports.log = log;
/**
 * Can be used as identifier for alphanumeric type.
 */
class Alphanumeric {
}
exports.Alphanumeric = Alphanumeric;
// ---------------- State
const validators = {
    alphanumeric: { name: 'alphanumeric', function: isAlphanumeric },
    array: { name: 'array', function: lodash_1.default.isArray },
    boolean: { name: 'boolean', function: lodash_1.default.isBoolean },
    function: { name: 'function', function: lodash_1.default.isFunction },
    number: { name: 'number', function: lodash_1.default.isNumber },
    object: { name: 'object', function: lodash_1.default.isPlainObject },
    string: { name: 'string', function: lodash_1.default.isString }
};
// ---------------- End State
function namePrefix(name) {
    if (!name)
        return '';
    return `${name}: `;
}
function valueType(value) {
    return lodash_1.default.isFunction(value) ? value.name : value;
}
class ValidationError extends Error {
    static getMessage(value, expectedType, name) {
        return `${namePrefix(name)}Expected ${expectedType}, ${valueType(value)} given.`;
    }
    constructor(value, expectedType, name) {
        super(ValidationError.getMessage(value, expectedType, name));
    }
}
exports.ValidationError = ValidationError;
/**
 * Set a validator for a given type. This validator can then be used from `checkType` with the specified type name.
 * @param {string} type			The name of the type.
 * @param {validator} validator	Validator function.
 * @param {string} [name]		Optional name. Will be displayed in the error messages instead of the type name.
 */
function setValidator(type, validator, name) {
    if (name === undefined)
        name = type;
    validators[type] = {
        name: name,
        function: validator
    };
}
exports.setValidator = setValidator;
function check(value, validator, expected, name, options) {
    let valid = validator(value);
    if (valid)
        return value;
    let defaultValue = options === null || options === void 0 ? void 0 : options.defaultValue;
    if (options === null || options === void 0 ? void 0 : options.defaultValue) {
        if (lodash_1.default.isFunction(options.defaultValue)) {
            defaultValue = options.defaultValue(value);
        }
        let shouldWarn = (options === null || options === void 0 ? void 0 : options.warnIf) || ((x) => !lodash_1.default.isNil(x));
        if (shouldWarn(value)) {
            log.warn(ValidationError.getMessage(value, expected, name));
        }
        // TS: cannot be function anymore because we checked for that
        return defaultValue;
    }
    throw new ValidationError(value, expected, name);
}
exports.check = check;
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
function checkType(value, type, name, defaultValue = undefined, warnIf = (x) => !lodash_1.default.isNil(x)) {
    let valid = false;
    let expectedType = type;
    // Validate
    if (isClass(type)) {
        valid = value instanceof type;
        expectedType = `instance of ${type.name}`;
    }
    else if (lodash_1.default.isString(type)) {
        if (!(type in validators)) {
            return false;
        }
        const validate = validators[type].function;
        valid = validate(value);
    }
    // All good, just return value
    if (valid) {
        return value;
    }
    // Without default value we cannot continue and we have to throw an Error
    if (defaultValue === undefined) {
        throw new ValidationError(value, expectedType, name);
    }
    // Generate default value from given function
    if (lodash_1.default.isFunction(defaultValue)) {
        defaultValue = defaultValue(value);
    }
    // Should we provide a warning?
    if (warnIf(value)) {
        log.warn(`${namePrefix(name)}Expected ${type}, ${valueType(value)} given. Using default:`, defaultValue);
    }
    return defaultValue;
}
exports.checkType = checkType;
/**
 * Checks if a value is a number or a string.
 * @param value
 * @return {boolean}
 */
function isAlphanumeric(value) {
    // parseFloat can handle non-strings fine; it will just return NaN
    return !isNaN(parseFloat(value)) || lodash_1.default.isString(value);
}
exports.isAlphanumeric = isAlphanumeric;
/**
 * Attempts to parse the given value as a number. Returns `null` if not possible, or if parsed number is different from
 * the input string (e.g. leading zero was removed in the process).
 * @param {number} value
 * @return {number|null}
 */
function parseNumberStrict(value) {
    if (typeof value === 'number')
        return value;
    if (typeof value !== 'string')
        return null;
    // variable is string from here on
    let asNumber = parseFloat(value);
    if (isNaN(asNumber))
        return null;
    return asNumber.toString() === value ? asNumber : null;
}
exports.parseNumberStrict = parseNumberStrict;
/**
 * Checks if a value is a primitive (string/number/boolean).
 * @param value
 * @return {boolean}
 */
function isPrimitive(value) {
    return lodash_1.default.isString(value) || lodash_1.default.isNumber(value) || lodash_1.default.isBoolean(value);
}
exports.isPrimitive = isPrimitive;
/**
 * Checks if a value is a class (or function).
 * @param variable
 * @return {boolean}
 */
function isClass(variable) {
    return lodash_1.default.isFunction(variable);
}
exports.isClass = isClass;
/**
 * Checks if a value is a subclass of the given parent class.
 * @param value
 * @param {Class} Parent
 * @param {boolean} [includeIdentity]	Determines whether Parent itself should be considered a sub-class (defaults to true).
 * @return {boolean}
 */
function isSubClass(value, Parent, includeIdentity = true) {
    if (!isClass(value))
        return false;
    return value.prototype instanceof Parent || (includeIdentity && value === Parent);
}
exports.isSubClass = isSubClass;
/**
 * Returns a validator function that checks if its argument is a subclass of the given parent class.
 * @param {Class} Parent
 * @param {boolean} [includeIdentity]	Determines whether Parent itself should be considered a sub-class (defaults to true).
 * @return {validator}
 */
function subClass(Parent, includeIdentity = true) {
    return (value) => isSubClass(value, Parent, includeIdentity);
}
exports.subClass = subClass;
/**
 * Returns a validator function that checks if its argument is an instance of the given class.
 * @param {Class} Class
 */
function instanceOf(Class) {
    return (value) => value instanceof Class;
}
exports.instanceOf = instanceOf;
