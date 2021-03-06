/*!
 * @devtin/schema-validator v2.6.0
 * (c) 2019-2020 Martin Rafael Gonzalez <tin@devtin.io>
 * MIT
 */
/**
 * @method Utils~castArray
 * @desc Makes sure a value is wrapped in an array
 * @param {*} value - The value to wrap in an array. If the value is already an array, it is returned as is.
 * @return {Array}
 */
function castArray (value) {
  return Array.isArray(value) ? value : [value]
}

/**
 * @class Utils
 * @classdesc Set of utilities
 */

/**
 * @method Utils~obj2dot
 * @desc Converts given object's own properties tree in a dot notation array
 * @param {Object} obj
 * @param {String} [parent]
 * @param {String} [separator=.]
 * @return {String[]}
 *
 * @example
 *
 * ```js
 * Utils.obj2dot({
 *   name: 'Martin',
 *   address: {
 *     city: 'Miami',
 *     zip: 33129,
 *     line1: 'Brickell ave'
 *   }
 * }) // => ['name', 'address.city', 'address.zip', 'address.line1']
 * ```
 */
function obj2dot (obj, { parent = '', separator = '.' } = {}) {
  const paths = [];
  Object.keys(obj).forEach(prop => {
    if (obj[prop] && typeof obj[prop] === 'object' && !Array.isArray(obj[prop])) {
      return paths.push(...obj2dot(obj[prop], { parent: `${ parent }${ prop }${ separator }`, separator }))
    }
    paths.push(`${ parent }${ prop }`);
  });
  return paths
}

/**
 * @method Utils~find
 * @desc Deeply finds given dot-notation path of an objects
 * @param {Object} obj
 * @param {String} path - Dot-notation address of the desired property
 * @return {*} Found value
 *
 * @example
 *
 * ```js
 * const obj = {
 *   prop1: {
 *     prop2: {
 *       prop3: 'Martin'
 *     },
 *     firstName: 'Sandy'
 *   }
 * }
 *
 * console.log(find(obj, 'prop1.prop2.prop3') // => Martin
 * console.log(find(obj, 'prop1 .firstName') // => Sandy
 * ```
 */
function find (obj, path) {
  const [prop, paths] = path.split(/\./);
  if (paths && typeof obj[prop] === 'object') {
    return find(obj[prop], paths)
  }
  return obj[prop]
}

/**
 * @method Utils~forEach
 * @desc Loops into given array alternatively breaking the look when the callback returns `false` (explicitly).
 * @param {Array} arr
 * @param {Function} cb - Callback function called per item in the array passing the item and index as arguments.
 */
function forEach(arr, cb) {
  for (let i = 0; i < arr.length; i++) {
    if (cb(arr[i], i) === false) {
      break
    }
  }
}

/**
 * @method Utils~render
 * @desc Renders handle bars kind-of semantics
 *
 * @param {String} template - Handlebars single-bar template
 * @param {Object} obj
 *
 * @example
 * ```js
 * const obj = {
 *   address: {
 *     line1: 'Brickell Ave'
 *   }
 * }
 *
 * console.log(render(`{ address.line1 }`)) // => 'Brickell Ave'
 * ```
 */

function render (template, obj) {
  const objProps = obj2dot(obj);
  objProps.forEach(prop => {
    template = template.replace(new RegExp(`{[\\s]*${ prop }[\\s]*}`, 'g'), find(obj, prop));
  });
  return template
}

function getSubProperties (properties, parent) {
  const pattern = new RegExp(`^${ parent }\\.`);
  return properties.filter(prop => pattern.test(prop)).map(prop => prop.replace(pattern, ''))
}

/**
 * @method Utils~propertiesRestricted
 * @desc Validates that given `obj`'s properties exists in `properties`.
 * @param {Object} obj - The object to analyze
 * @param {String[]} properties - Properties to validate
 * @param {Object} [options]
 * @param {Boolean} [options.strict=false] - When set to `true`, validates that `obj` actually has all `properties`.
 *
 * @example
 *
 * ```js
 * const user = {
 *   name: 'Martin Rafael',
 *   email: 'tin@devtin.io',
 *   address: {
 *     city: 'Miami, Fl',
 *     zip: 33129,
 *     line1: 'Brickell Ave'
 *   }
 * }
 *
 * console.log(Utils.propertiesRestricted(user, ['name'])) // => false
 * console.log(Utils.propertiesRestricted(user, ['name', 'email', 'address'])) // => true
 * console.log(Utils.propertiesRestricted(user, ['name', 'email', 'address.city', 'address.zip', 'address.line1', 'address.line2'])) // => true
 * console.log(Utils.propertiesRestricted(user, ['name', 'email', 'address.city', 'address.zip', 'address.line1', 'address.line2'], { strict: true })) // => false
 * ```
 */

function propertiesRestricted (obj, properties, { strict = false } = {}) {
  if (typeof obj !== 'object') {
    return false
  }

  let valid = true;

  if (strict) {
    forEach(properties, property => {
      if (property.indexOf('.') > 0) {
        const [parent] = property.split('.');
        return valid = propertiesRestricted(obj[parent], getSubProperties(properties, parent), { strict })
      }

      if (!Object.prototype.hasOwnProperty.call(obj, property)) {
        return valid = false
      }
    });
  }

  if (valid) {
    forEach(Object.keys(obj), property => {
      if (typeof obj[property] === 'object' && !Array.isArray(obj[property])) {
        const propMatch = new RegExp(`^${ property }\\.(.+)$`);
        let defaultApproved = properties.indexOf(property) >= 0;
        const childProps = properties
          .filter((v) => {
            return propMatch.test(v)
          })
          .map(v => {
            defaultApproved = false;
            return v.replace(propMatch, '$1')
          });

        return valid = defaultApproved || propertiesRestricted(obj[property], childProps)
      }

      if (properties.indexOf(property) === -1) {
        return valid = false
      }
    });
  }

  return valid
}

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  castArray: castArray,
  obj2dot: obj2dot,
  find: find,
  forEach: forEach,
  render: render,
  propertiesRestricted: propertiesRestricted
});

/**
 * @typedef {Array} ValueError
 * @desc Used as value in certain settings to alternatively customize error messages
 * @property {*} 0 - The value
 * @property {String} 1 - Alternative error message
 *
 * @example
 *
 * ```js
 * const ValueError = [3, `username's must have at least three characters`]
 * const mySchema = new Schema({
 *   username: {
 *     type: String,
 *     minlength: ValueError
 *   }
 * })
 * ```
 */

/**
 * @method Utils~castThrowable
 * @param {(*|ValueError)} value - The value
 * @param {String} error - Default error message
 * @return {ValueError}
 */
function castThrowable (value, error) {
  if (Array.isArray(value) && value.length === 2) {
    return value
  }

  return [value, error]
}

/**
 * @typedef {Function} Validator
 * @desc Synchronous function that validates that given value is of the expected kind. Throws a {@link Schema~ValidationError} when not.
 * @param {*} value - The value being validated
 * @return {void}
 * @throws Schema~ValidationError
 */

/**
 * @typedef {Function} Parser
 * @desc Synchronous function that performs custom logic possibly customized via settings that could transform given
 * value, throwing a {Schema~ValidationError} when error.
 * @param {*} value - The value being validated
 * @return {*} Resulting value
 * @throws Schema~ValidationError
 */

/**
 * @typedef {Function} Caster
 * @desc Synchronous function that performs some logic attempting to cast given value into expected one. Returns the
 * original value in case it could not be guessed.
 * @param {*} value - The value being casted
 * @return {*} Resulting value
 */

/**
 * @typedef {Object} Transformer
 * @desc A transformer holds the logic of instantiating a data type (casting, validation and parsing).
 * @property {Object} [settings] - Initial transformer settings
 * @property {Caster} [cast] - Cast function
 * @property {Parser} [parse] - Parser function
 * @property {Validator} [validate] - Validator function
 * @property {String[]} [loaders] - Transformer names to pipe the value through prior handling it with the parser function.
 */

/**
 * @constant {Object} Transformers
 * @desc key map object that holds the available Transformer's (types) that can be validated.
 */

const Transformers = {
  /**
   * @constant {Transformer} Transformers.Array
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid array] - Default error message thrown
   * @property {SchemaSettings} [settings.arraySchema] - Alternatively initializes (which involves validating, casting and parsing)
   * array items using given schema.
   * @property {Parser} parse - Alternatively instantiates array items given an `arraySchema`.
   * @property {Validator} validate - Validates that given value is an array
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
   */
  Array: {
    settings: {
      typeError: `Invalid array`
    },
    parse (value) {
      if (this.settings.arraySchema) {
        value = value.map((value, name) => {
          return (new this.constructor(this.settings.arraySchema, Object.assign({}, this.settings.arraySchema, {
            name,
            parent: this
          }))).parse(value)
        });
      }
      return value
    },
    validate (value) {
      if (!Array.isArray(value)) {
        this.throwError(Transformers.Array.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.BigInt
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid bigint] - Default error message thrown
   * @property {Boolean} [settings.autoCast=false] - Whether to automatically cast values or not
   * @property {Validator} validate - Confirms given value is a `BigInt`
   * @property {Caster} cast - Converts `String`s and `Number`s into `BigInt` (if possible)
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
   */
  BigInt: {
    settings: {
      typeError: 'Invalid bigint',
      autoCast: false
    },
    validate (value) {
      if (typeof value !== 'bigint') {
        this.throwError(Transformers.BigInt.settings.typeError);
      }
    },
    cast (value) {
      if (/^(string|number)$/.test(typeof value)) {
        try {
          value = BigInt(value);
        } catch (e) {
          // shh...
        }
      }
      return value
    }
  },
  /**
   * @constant {Transformer} Transformers.Boolean
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid boolean] - Default error message thrown
   * @property {Boolean} [settings.autoCast=false] - Whether to auto-cast truthy values into `true` and falsy ones into `false`.
   * @property {Caster} cast - Casts truthy values into `true` and falsy ones into `false`
   * @property {Validator} validate - Confirms given value is a `Boolean`.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
   */
  Boolean: {
    settings: {
      typeError: `Invalid boolean`,
      autoCast: false
    },
    cast (value) {
      return !!value
    },
    validate (value) {
      if (typeof value !== 'boolean') {
        this.throwError(Transformers.Boolean.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.Date
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid date] - Default error message thrown
   * @property {Boolean} [settings.autoCast=true]
   * @property {Caster} cast - Casts `String`s into `Date`'s when possible
   * @property {Validator} validate - Validates given value is a `Date`
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
   */
  Date: {
    settings: {
      typeError: `Invalid date`,
      autoCast: true
    },
    cast (value) {
      if (value instanceof Date) {
        return value
      }

      const suggested = new Date(Number.isInteger(value) ? value : Date.parse(value));

      if (suggested.toString() !== 'Invalid Date') {
        value = suggested;
      }
      return value
    },
    validate (value) {
      if (!(value instanceof Date)) {
        this.throwError(Transformers.Date.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.Function
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid function] - Default error message thrown
   * @property {Validator} validate - Validates given value is a `Function`
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
   */
  Function: {
    settings: {
      typeError: `Invalid function`
    },
    validate (value) {
      if (typeof value !== 'function') {
        this.throwError(Transformers.Function.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.Number
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid number] - Default error message thrown
   * @property {Boolean} [settings.autoCast=false] - Whether to auto-cast `String`'s with numeric values.
   * @property {Caster} cast - Tries to cast given value into a `Number`
   * @property {Validator} validate - Validates given value is a `Number`
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
   */
  Number: {
    settings: {
      typeError: `Invalid number`,
      autoCast: false
    },
    cast (value) {
      return Number(value)
    },
    validate (value) {
      if (typeof value !== 'number' || isNaN(value)) {
        this.throwError(Transformers.Number.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.Object
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid object] - Default error message thrown
   * @property {Validator} validate - Confirms given value is an object
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
   */
  Object: {
    settings: {
      typeError: `Invalid object`
    },
    validate (value) {
      if (typeof value !== 'object') {
        this.throwError(Transformers.Object.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.Promise
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid Promise] - Default error message thrown
   * @property {Boolean} [settings.autoCast=false] - Whether to auto-cast values into Promises.
   * @property {Function} [settings.isPromise] - Checks whether given value is or not a Promise
   * @property {Validator} validate - Validates given values is a `Promise`
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   * @see https://stackoverflow.com/a/27746324/1064165
   */
  Promise: {
    settings: {
      typeError: `Invalid Promise`,
      autoCast: false,
      isPromise (v) {
        return typeof v === 'object' && typeof v.then === 'function'
      }
    },
    cast (value) {
      if (Transformers.Promise.settings.isPromise(value)) {
        return value
      }

      if (typeof value === 'function') {
        return Promise.resolve(value())
      }

      return Promise.resolve(value)
    },
    validate (value) {
      if (!Transformers.Promise.settings.isPromise(value)) {
        this.throwError(Transformers.Promise.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.Set
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid set] - Default error message thrown
   * @property {Boolean} [settings.autoCast=true] - Whether to auto-cast `Array`'s into `Set`'s.
   * @property {Caster} cast - Casts `Array` into `Set`
   * @property {Validator} validate - Validates given values is a `Set`
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
   */
  Set: {
    settings: {
      typeError: `Invalid set`,
      autoCast: true
    },
    cast (value) {
      if (Array.isArray(value)) {
        value = new Set(value);
      }

      return value
    },
    validate (value) {
      if (!(value instanceof Set)) {
        this.throwError(Transformers.Set.settings.typeError, { value });
      }
    }
  },
  /**
   * @constant {Transformer} Transformers.String
   * @property {Object} settings - Default transformer settings
   * @property {String} [settings.typeError=Invalid string] - Default error message thrown
   * @property {String} [settings.enumError=Invalid enum option { value }] - Default error message thrown
   * @property {String[]} [settings.enum] - Whether to restrict allowed values to given sample.
   * @property {Boolean} [settings.autoCast=false] - Whether to auto-cast objects with method `toString`.
   * @property {(Number|ValueError)} [settings.minlength] - Optional minimum length
   * @property {(Number|ValueError)} [settings.maxlength] - Optional maximum length
   * @property {(RegExp|ValueError)} [settings.regex] - Optional RegExp to match against given string
   * @property {Caster} cast - Basically checks if a value is an object and this object has the method `toString`. If so,
   * calls the method and checks returning value does not look like `[object Object]`; if so, returns whatever value
   * was returned by the method.
   * @property {Validator} validate - Validates given value is a `String`. Additionally, performs built-in validations:
   * minlength, maxlength and regex.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
   */
  String: {
    settings: {
      typeError: `Invalid string`,
      enumError: `Unknown enum option { value }`,
      enum: [],
      autoCast: false
    },
    cast (v) {
      if (v && Object.hasOwnProperty.call(v, 'toString') && typeof v.toString === 'function' && v.toString() !== '[object Object]') {
        v = v.toString();
      }
      return v
    },
    validate (value) {
      if (typeof value !== 'string') {
        this.throwError(Transformers.String.settings.typeError, { value });
      }

      if (Array.isArray(this.settings.enum) && this.settings.enum.length > 0 && this.settings.enum.indexOf(value) < 0) {
        this.throwError(Transformers.String.settings.enumError, { value });
      }

      if (this.settings.minlength) {
        const [minlength, error] = castThrowable(this.settings.minlength, `Invalid minlength`);

        if (value.length < minlength) {
          this.throwError(error, { value });
        }
      }

      if (this.settings.maxlength) {
        const [maxlength, error] = castThrowable(this.settings.maxlength, `Invalid maxlength`);

        if (value.length > maxlength) {
          this.throwError(error, { value });
        }
      }

      if (this.settings.regex) {
        const [regex, error] = castThrowable(this.settings.regex, `Invalid regex`);

        if (!regex.test(value)) {
          this.throwError(error, { value });
        }
      }
    }
  }
};

/**
 * @class Schema~ValidationError
 * @classdesc Thrown by {@link Schema}
 * @property {*} value - Given value
 * @property {Schema} field
 * @property {Schema~ValidationError[]} errors - Errors found
 */
class ValidationError extends Error {
  constructor (message, { errors = [], value, field }) {
    super(render(message, { errors, value, field }));
    this.errors = errors;
    this.value = value;
    this.field = field;
  }
}

const fnProxyStub = v => v;

/**
 * @typedef {Object} Schema~TheSchema
 * @desc This object defines the schema or desired structure of an arbitrary object.
 *
 * @example
 *
 * ```js
 * const MySchemaStructure = {
 *   name: String,
 *   email: String,
 *   address: {
 *     zip: Number,
 *     street: String
 *   }
 * }
 * ```
 */

/**
 * @typedef {Object} Schema~SchemaSettings
 * @desc This object describes the settings of a schema-property and serves as a host to hold possible other settings
 * belonging to its correspondent transformer.
 * @property {String} type - Name of the available {@link Transformers} to use to process the value.
 * @property {Boolean} [required=true] - Whether the property is or not required.
 * @property {Boolean} [allowNull=false] - Whether the allow null values or not.
 * @property {Caster} [cast] - An (optional) additional caster
 * @property {Validator} [validate] - An (optional) additional validator
 * @property {(Function|*)} [default] - Default value when non-passed. Mind this will treat properties as `required=false`.
 * When a function is given, its called using the schema of the property as its `this` object, receiving given value as
 * first argument. Must return the desired default value.
 *
 * @example
 *
 * ```js
 * new Schema({
 *   // when an SchemaSetting is an object it will have a property named `type`.
 *   name: {
 *     type: String, // < it is a SchemaSetting since it has a property called type
 *     validate (value) {
 *       if (/^[a-z]/.test(value)) {
 *         throw new Error(`Start your name in uppercase, please`)
 *       }
 *     }
 *   }
 * })
 * ```
 */

/**
 * @classdesc Orchestrates the validation of a data schema
 * @property {Schema} [parent] - Nested objects will have a {@link Schema} in this property
 * @property {String} name - Nested objects will have the name of it's containing property
 * @property {Schema~SchemaSettings} schema - The schema
 */
class Schema {
  /**
   * @constructor
   * @description Sets the environment up:
   * - Stores the schema locally
   * - Guesses the type of the schema
   * @param {Schema~TheSchema|Object} schema
   * @param {Object} [options]
   * @param {String} [options.name] - Alternative name of the object
   * @param {Object} [options.defaultValues] - Default values to override the schema with
   * @param {Schema} [options.parent]
   * @param {Caster} [options.cast] - Schema caster
   * @param {Object} [options.settings] - Initial settings
   * @param {Validator} [options.validate] - Final validation
   */
  constructor (schema, { name, defaultValues = {}, parent, validate, cast, settings = {} } = {}) {
    this._settings = settings;

    this.schema = schema;
    this.parent = parent;
    // schema level validation: validates using the entire value (maybe an object) of this path
    this._validate = validate;
    // schema level c: validates using the entire value (object) of this path
    this._cast = cast;
    this.name = name || '';
    this.originalName = this.name;
    this.type = Schema.guessType(schema);
    this.currentType = castArray(this.type)[0];
    this.children = [];
    this._defaultSettings = {
      required: true,
      allowNull: false,
      default: undefined
    };
    this._defaultValues = defaultValues;

    /**
     * @property {String} type - The schema type. Options vary according to available Transformers. Could be 'Schema'
     * for nested objects.
     * @property {Schema[]} [children] - For nested objects
     */

    if (Schema.isNested(schema)) {
      this.children = this._parseSchema(schema);
    } else {
      this._settings = typeof schema === 'object' ? Object.assign({}, this._settings, { required: schema.default === undefined }, schema) : this._settings;
      delete this._settings.type;
    }

    if (this.settings.default !== undefined && this.settings.required) {
      throw new Error(`Remove either the 'required' or the 'default' option for property ${ this.fullPath }.`)
    }

    this._defaultSettings.default = this.getDefault();
  }

  get hasChildren () {
    return this.children.length > 0
  }

  get validate () {
    return this._validate || fnProxyStub
  }

  get cast () {
    return this._cast || fnProxyStub
  }

  get settings () {
    if (!this.hasChildren && Transformers[this.currentType] && Transformers[this.currentType].settings) {
      return Object.assign(this._defaultSettings, Transformers[this.currentType].settings, this._settings)
    }
    return Object.assign(this._defaultSettings, this._settings)
  }

  static castSchema (obj) {
    if (obj instanceof Schema) {
      return obj
    }
    if (typeof obj === 'object' && Schema.guessType(obj.type) === 'Schema') {
      return obj.type
    }
    return obj
  }

  static castSettings (obj) {
    if (obj instanceof Schema) {
      return obj.settings
    }
    const settings = Object.assign({}, obj);
    delete settings.type;
    return settings
  }

  _parseSchema (obj) {
    return Object.keys(obj).map((prop) => {
      if (Schema.guessType(obj[prop]) === 'Schema') {
        const schemaClone = Schema.cloneSchema({
          schema: Schema.castSchema(obj[prop]),
          settings: Schema.castSettings(obj[prop]),
          name: prop,
          parent: this
        });
        return schemaClone
      }
      return new Schema(obj[prop], { name: prop, parent: this })
    })
  }

  /**
   * Checks whether a given object is a nested object
   *
   * @param {Object} obj
   * @return {boolean}
   */
  static isNested (obj) {
    return Schema.guessType(obj) === 'Object' && !obj.type
  }

  static guessType (value) {
    if (value instanceof Schema) {
      return 'Schema'
    }

    if (typeof value === 'function') {
      return value.name
    }

    if (typeof value === 'object' && value.type) {
      return Schema.guessType(value.type)
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return 'Object'
    }

    if (Array.isArray(value)) {
      value = value.map(Schema.guessType);
    }

    return value
  }

  get fullPath () {
    return (this.parent && this.parent.fullPath ? `${ this.parent.fullPath }.` : '') + this.name
  }

  get ownPaths () {
    return this.children.map(({ name }) => name)
  }

  /**
   * @property {String[]} paths - Contains paths
   */
  get paths () {
    const foundPaths = [];

    if (this.hasChildren) {
      this.children.forEach(({ paths }) => {
        paths.forEach(path => {
          foundPaths.push((this.name ? `${ this.name }.` : '') + path);
        });
      });
    } else {
      foundPaths.push(this.name);
    }

    return foundPaths
  }

  static cloneSchema ({ schema, name, parent, settings = {}, defaultValues = {} }) {
    const clonedSchema = Object.assign(Object.create(Object.getPrototypeOf(schema)), schema, {
      name: name || schema.name,
      parent,
      cloned: true,
      _defaultValues: defaultValues,
      _settings: Object.assign({}, /*parent ? parent._settings : {}, */settings)
    });
    if (clonedSchema.children) {
      clonedSchema.children = clonedSchema.children.map(theSchema => Schema.cloneSchema({
        schema: theSchema,
        parent: clonedSchema
      }));
    }
    return clonedSchema
  }

  /**
   * Finds schema in given path
   * @param {String} pathName - Dot notation path
   * @return {Schema}
   */
  schemaAtPath (pathName) {
    const [path, rest] = pathName.split(/\./);
    let schema;
    forEach(this.children, possibleSchema => {
      if (possibleSchema.name === path) {
        schema = possibleSchema;
        return false
      }
    });

    if (rest) {
      return schema.schemaAtPath(rest)
    }

    return schema
  }

  /**
   * Checks whether the schema contains given fieldName
   * @param fieldName
   * @return {Boolean}
   */
  hasField (fieldName) {
    return this.paths.indexOf(fieldName) >= 0
  }

  /**
   * Validates if the given object have a structure valid for the schema in subject
   * @param {Object} obj - The object to evaluate
   * @throws {Schema~ValidationError}
   */
  structureValidation (obj) {
    // console.log(`structureValidation`, this.name, this.ownPaths, propertiesRestricted(obj, this.ownPaths), this.type)
    if (!obj || !this.hasChildren) {
      return true
    }
    if (!propertiesRestricted(obj, this.ownPaths)) {
      const unknownFields = [];
      if (obj) {
        obj2dot(obj).forEach(field => {
          if (!this.hasField(field)) {
            unknownFields.push(new Error(`Unknown property ${ field }`));
          }
        });
      }
      throw new ValidationError(`Invalid object schema`, { errors: unknownFields, value: obj })
    }
  }

  /**
   * Validates schema structure, casts, validates and parses  hooks of every field in the schema
   * @param {Object} [v] - The object to evaluate
   * @return {Object} The sanitized object
   * @throws {ValidationError} when given object does not meet the schema
   */
  parse (v) {
    if (this.hasChildren) {
      v = this.runChildren(v);
    } else {
      // console.log(this)
      v = this.parseProperty(this.type, v);

      /*
      Value here would be:
      - casted
      - validated
      - parsed
       */
    }

    // perform property-level hooks
    if (!this.parent) {
      // final casting / validation (schema-level)
      v = this.cast.call(this, v);
      this.validate.call(this, v);
    }

    return v
  }

  /**
   *
   * @param {*} v
   * @param {Schema~SchemaSettings[]} loaders
   * @return {*}
   */
  processLoaders (v, loaders) {
    // throw new Error(`uya!`)
    forEach(castArray(loaders), loaderSchema => {
      // console.log({ loaderSchema })
      if (typeof loaderSchema !== 'object') {
        loaderSchema = { type: loaderSchema };
      }

      const type = Schema.guessType(loaderSchema);
      const clone = Object.assign(Object.create(this), this, { type, _cast: undefined, _validate: undefined });

      if (type !== 'Schema') {
        clone._settings = Object.assign({}, clone._settings, loaderSchema, {
          loaders: undefined,
          cast: undefined,
          validate: undefined
        });
      }

      v = clone.parseProperty(type, v);
    });

    return v
  }

  parseProperty (type, v) {
    if (v === null && this.settings.allowNull) {
      return v
    }

    if (Array.isArray(type)) {
      let parsed = false;
      let result;
      forEach(type, t => {
        try {
          this.currentType = t;
          result = this.parseProperty(t, v);
          parsed = true;
          return false
        } catch (err) {
          // shh...
        }
      });
      if (!parsed) {
        this.throwError(`Could not resolve given value type`);
      }
      return result
    }
    const transformer = Transformers[type];

    if (!transformer) {
      this.throwError(`Don't know how to resolve ${ type }`);
    }

    if (this.settings.default !== undefined && v === undefined) {
      v = typeof this.settings.default === 'function' ? this.settings.default.call(this, v) : this.settings.default;
    }

    if (v === undefined && !this.settings.required) {
      return
    }

    if (v === undefined && this.settings.required) {
      const [required, error] = castThrowable(this.settings.required, `Property ${ this.fullPath } is required`);
      required && this.throwError(error, { value: v });
    }

    // run user-level loaders (inception transformers)
    if (this.settings.loaders) {
      v = this.processLoaders(v, this.settings.loaders); // infinite loop
    }

    // run transformer-level loaders
    if (transformer.loaders) {
      v = this.processLoaders(v, transformer.loaders);
    }

    v = this.runTransformer({ method: 'cast', transformer: this.settings, payload: v });

    // run transformer caster
    if (this.settings.autoCast) {
      v = this.runTransformer({ method: 'cast', transformer, payload: v });
    }

    // run transformer validator
    this.runTransformer({ method: 'validate', transformer, payload: v });
    this.runTransformer({ method: 'validate', transformer: this.settings, payload: v });

    // run transformer parser
    return this.runTransformer({ method: 'parse', transformer, payload: v })
  }

  runChildren (obj, { method = 'parse' } = {}) {
    if (!this.settings.required && obj === undefined) {
      return
    }
    const resultingObject = {};
    const errors = [];

    // error trapper
    const sandbox = (fn) => {
      try {
        fn();
      } catch (err) {
        if (err instanceof ValidationError) {
          if (err instanceof ValidationError && err.errors.length > 0) {
            errors.push(...err.errors);
          } else {
            errors.push(err);
          }
        } else {
          errors.push(err);
        }
      }
    };

    sandbox(() => this.structureValidation(obj));

    this.ownPaths.forEach(pathName => {
      const schema = this.schemaAtPath(pathName.replace(/\..*$/));
      const input = typeof obj === 'object' && obj !== null ? obj[schema.name] : undefined;

      sandbox(() => {
        const val = schema[method](input);
        if (val !== undefined) {
          Object.assign(resultingObject, { [schema.name]: val });
        }
      });
    });

    if (errors.length > 0) {
      throw new ValidationError(`Data is not valid`, { errors })
    }

    return resultingObject
  }

  /**
   * Runs given method found in transformer
   * @param method
   * @param transformer
   * @param payload
   * @return {*}
   */
  runTransformer ({ method, transformer, payload }) {
    if (!transformer[method]) {
      return payload
    }

    return transformer[method].call(this, payload)
  }

  throwError (message, { errors, value } = {}) {
    throw new ValidationError(message, { errors, value, field: this })
  }

  getDefault (child) {
    if (this.parent) {
      return this.parent.getDefault(child ? `${ this.name }.${ child }` : this.name)
    }

    if (child) {
      return find(this._defaultValues, child)
    }
  }
}

export { Schema, Transformers, index as Utils, ValidationError };
