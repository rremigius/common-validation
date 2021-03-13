import _ from 'lodash';
import Log from 'log-control';

const log = Log.instance("validation");

export type Class = {
	name:string;
	new (...args: any[]): {};
};

/**
 * Can be used as identifier for alphanumeric type.
 */
export class Alphanumeric {}

export type validator = (x:unknown)=>boolean;
export type primitive = string|boolean|number;
export type alphanumeric = string|number;

export type Constructor<T> = {
	new(...args: any[]): T;
};

export {log};

// ---------------- State
const validators:{
	[key:string]: {
		name: string,
		function: validator
	}
} = {
	alphanumeric: { name: 'alphanumeric', function: isAlphanumeric },
	array: { name: 'array', function: _.isArray	},
	boolean: { name: 'boolean', function: _.isBoolean },
	function: { name: 'function', function: _.isFunction } ,
	number: { name: 'number', function: _.isNumber },
	object: { name: 'object', function: _.isPlainObject },
	string: {name: 'string', function: _.isString }
};

// ---------------- End State

function namePrefix(name?:string) {
	if(!name) return '';
	return `${name}: `;
}

function valueType(value:unknown) {
	return _.isFunction(value) ? value.name : value;
}

export class ValidationError extends Error {
	static getMessage(value:unknown, expectedType:string, name?:string) {
		return `${namePrefix(name)}Expected ${expectedType}, ${valueType(value)} given.`;
	}

	constructor(value:unknown, expectedType:string, name?:string) {
		super(ValidationError.getMessage(value, expectedType, name));
	}
}

/**
 * Set a validator for a given type. This validator can then be used from `checkType` with the specified type name.
 * @param {string} type			The name of the type.
 * @param {validator} validator	Validator function.
 * @param {string} [name]		Optional name. Will be displayed in the error messages instead of the type name.
 */
export function setValidator(type:string, validator:validator, name?:string) {
	if(name === undefined) name = type;
	validators[type] = {
		name: name,
		function: validator
	};
}

export function check<T>(
	value:unknown,
	validator:(x:unknown)=>boolean,
	expected:string,
	name?:string,
	options?: {
		defaultValue?: T|((x: unknown) => T),
		warnIf?: (x: unknown) => boolean
	}
):T {
	let valid = validator(value);
	if(valid) return <T>value;

	let defaultValue = options?.defaultValue;
	if(options?.defaultValue) {
		if(_.isFunction(options.defaultValue)) {
			defaultValue = options.defaultValue(value);
		}
		let shouldWarn = options?.warnIf || ((x:unknown)=>!_.isNil(x));
		if(shouldWarn(value)) {
			log.warn(ValidationError.getMessage(value, expected, name));
		}
		// TS: cannot be function anymore because we checked for that
		return <T>defaultValue;
	}
	throw new ValidationError(value, expected, name);
}

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
export function checkType(
	value:unknown,
	type:string,
	name:string,
	defaultValue:unknown = undefined,
	warnIf:(x:unknown)=>boolean = (x:unknown)=>!_.isNil(x)
) {
	let valid = false;
	let expectedType = type;

	// Validate
	if(isClass(type)) {
		valid = value instanceof type;
		expectedType = `instance of ${type.name}`;
	} else if(_.isString(type)) {
		if(!(type in validators)) {
			return false;
		}
		const validate = validators[type].function;
		valid = validate(value);
	}

	// All good, just return value
	if(valid) {
		return value;
	}

	// Without default value we cannot continue and we have to throw an Error
	if(defaultValue === undefined) {
		throw new ValidationError(value, expectedType, name);
	}
	// Generate default value from given function
	if(_.isFunction(defaultValue)) {
		defaultValue = defaultValue(value);
	}
	// Should we provide a warning?
	if(warnIf(value)) {
		log.warn(`${namePrefix(name)}Expected ${type}, ${valueType(value)} given. Using default:`, defaultValue);
	}
	return defaultValue;
}

/**
 * Checks if a value is a number or a string.
 * @param value
 * @return {boolean}
 */
export function isAlphanumeric(value:unknown) {
	// parseFloat can handle non-strings fine; it will just return NaN
	return !isNaN(parseFloat(value as any)) || _.isString(value);
}

/**
 * Attempts to parse the given value as a number. Returns `null` if not possible, or if parsed number is different from
 * the input string (e.g. leading zero was removed in the process).
 * @param {number} value
 * @return {number|null}
 */
export function parseNumberStrict(value:unknown):number|null {
	if (typeof value === 'number') return value;
	if (typeof value !== 'string') return null;

	// variable is string from here on
	let asNumber = parseFloat(value);
	if(isNaN(asNumber)) return null;

	return asNumber.toString() === value ? asNumber : null;
}

/**
 * Checks if a value is a primitive (string/number/boolean).
 * @param value
 * @return {boolean}
 */
export function isPrimitive(value:unknown):value is primitive {
	return _.isString(value) || _.isNumber(value) || _.isBoolean(value);
}

/**
 * Checks if a value is a class (or function).
 * @param variable
 * @return {boolean}
 */
export function isClass(variable:unknown):variable is Class {
	return _.isFunction(variable);
}

/**
 * Checks if a value is a subclass of the given parent class.
 * @param value
 * @param {Class} Parent
 * @param {boolean} [includeIdentity]	Determines whether Parent itself should be considered a sub-class (defaults to true).
 * @return {boolean}
 */
export function isSubClass(value:unknown, Parent:Class, includeIdentity = true):value is Class {
	if(!isClass(value)) return false;

	return value.prototype instanceof Parent || (includeIdentity && value === Parent);
}

/**
 * Returns a validator function that checks if its argument is a subclass of the given parent class.
 * @param {Class} Parent
 * @param {boolean} [includeIdentity]	Determines whether Parent itself should be considered a sub-class (defaults to true).
 * @return {validator}
 */
export function subClass(Parent:Class, includeIdentity = true) {
	return (value:unknown) => isSubClass(value, Parent, includeIdentity);
}

/**
 * Returns a validator function that checks if its argument is an instance of the given class.
 * @param {Class} Class
 */
export function instanceOf(Class:Class) {
	return (value:unknown) => value instanceof Class;
}
