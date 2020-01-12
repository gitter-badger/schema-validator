/*!
 * @devtin/schema-validator v1.1.1
 * (c) 2019-2020 Martin Rafael <tin@devtin.io>
 * MIT
 */
var SchemaValidator=function(a){'use strict';function b(a){return Array.isArray(a)?a:[a]}function c(a,{parent:b="",separator:d="."}={}){const e=[];return Object.keys(a).forEach(f=>"object"!=typeof a[f]||Array.isArray(a[f])?void e.push(`${b}${f}`):e.push(...c(a[f],{parent:`${b}${f}${d}`,separator:d}))),e}function d(a,b){const[c,e]=b.split(/\./);return e&&"object"==typeof a[c]?d(a[c],e):a[c]}function e(a,b){for(let c=0;c<a.length&&!1!==b(a[c],c);c++);}function f(a,b){const e=c(b);return e.forEach(c=>{a=a.replace(new RegExp(`{[\\s]*${c}[\\s]*}`,"g"),d(b,c))}),a}function g(a,b,{strict:c=!1}={}){if("object"!=typeof a)return!1;let d=!0;return c&&e(b,b=>{if(0<b.indexOf(".")){const[e,f]=b.split(/\./);return d=g(a[e],[f],{strict:c})}return a.hasOwnProperty(b)?d=!1:void 0}),d&&e(Object.keys(a),c=>{if("object"==typeof a[c]&&!Array.isArray(a[c])){const e=new RegExp(`^${c}\.(.+)$`);let f=0<=b.indexOf(c);const h=b.filter(a=>e.test(a)).map(a=>(f=!1,a.replace(e,"$1")));return d=f||g(a[c],h)}return-1===b.indexOf(c)?d=!1:void 0}),d}var h=Object.freeze({__proto__:null,castArray:b,obj2dot:c,find:d,forEach:e,render:f,propertiesRestricted:g});class i extends Error{constructor(a,{errors:d=[],value:b,field:c}={}){super(f(a,{errors:d,value:b,field:c})),this.errors=d,this.value=b,this.field=c}}const j={String:{parse(a){if("string"!=typeof a&&(!("object"==typeof a&&a.hasOwnProperty("toString"))&&this.throwError(`Invalid string`,{value:a}),a=a.toString()),this.settings.minlength){const[b,c]=k.castThrowable(this.settings.minlength,`Invalid minlength`);a.length<b&&this.throwError(c,{value:a})}if(this.settings.maxlength){const[b,c]=k.castThrowable(this.settings.maxlength,`Invalid maxlength`);a.length>b&&this.throwError(c,{value:a})}if(this.settings.regex){const[b,c]=k.castThrowable(this.settings.regex,`Invalid regex`);b.test(a)||this.throwError(c,{value:a})}return a}},Boolean:{parse(a){return!!a}},Object:{parse(a){return"object"!=typeof a&&this.throwError(`Invalid object`,{value:a}),v}},Array:{parse(a){return Array.isArray(a)||this.throwError(`Invalid array`,{value:a}),a}},Set:{parse(a){return Array.isArray(a)&&(a=new Set(a)),a instanceof Set||this.throwError(`Invalid set`,{value:a}),a}},Number:{parse(a){return a=+a,isNaN(a)&&this.throwError(`Invalid number`,{value:a}),a}},Date:{parse(a){var b=Number.isInteger;return a=new Date(b(a)?a:Date.parse(a)),"Invalid Date"===a.toString()&&this.throwError(`Invalid date`,{value:a}),a}},Function:{parse(a){return"function"!=typeof a&&this.throwError(`Invalid function`,{value:a}),a}}};class k{constructor(a,{name:b,parent:c}={}){this.settings={},this.schema=a,this.parent=c,this.name=b||"",k.isNested(a)?(this.type=this.constructor.name,this.children=this._parseSchema(a)):(this.type=k.guessType(a),this.settings="object"==typeof a?Object.assign({},a):{},delete this.settings.type)}static castThrowable(a,b){return Array.isArray(a)&&2===a.length?a:[a,b]}_parseSchema(a){return k.isNested(a)?Object.keys(a).map(b=>{if(a[b]instanceof k){const c=Object.assign(Object.create(Object.getPrototypeOf(a[b])),a[b],{name:b,parent:this,settings:this.settings});return c.name=b,c.parent=this,c}return new k(a[b],{name:b,parent:this})}):[]}static isNested(a){return"object"==typeof a&&!a.type}static guessType(a){return"function"==typeof a?a.name:"object"==typeof a&&a.type?k.guessType(a.type):"string"==typeof a?a:"Schema"}get fullPath(){return(this.parent&&this.parent.fullPath?`${this.parent.fullPath}.`:"")+this.name}get ownPaths(){return this.children.map(({name:a})=>a)}get paths(){const a=[];return this.children?this.children.forEach(({paths:b})=>{b.forEach(b=>{a.push((this.name?`${this.name}.`:"")+b)})}):a.push(this.name),a}schemaAtPath(a){const[b]=a.split(/\./);let c;return e(this.children,a=>{if(a.name===b)return c=a,!1}),c}hasField(a){return 0<=this.paths.indexOf(a)}structureValidation(a){if(!a)return!0;if(!g(a,this.ownPaths)){const b=[];throw a&&c(a).forEach(a=>{this.hasField(a)||b.push(new Error(`Unknown property ${a}`))}),new i(`Invalid object schema`,{errors:b,value:a})}}parse(a){if(this.children){let b;try{b=this._parseNested(a)}catch(a){throw a}return b}return this.settings.default&&!a&&(a="function"==typeof this.settings.default?this.settings.default(a):this.settings.default),this._run(this.type,a)}_run(a,c){const d=j[a];if(!d)throw new Error(`Don't know how to resolve ${a}`);if(void 0!==c||this.settings.required){if(!c&&this.settings.required){const[a,b]=k.castThrowable(this.settings.required,`Field ${this.fullPath} is required`);a&&this.throwError(b,{value:c})}return d.loaders&&e(b(d.loaders),a=>{const b=k.guessType(a);c=this._run(b,c)}),d.parse.call(this,c)}}_parseNested(a){this.structureValidation(a);const b={},c=[];if(this.ownPaths.forEach(d=>{const e=this.schemaAtPath(d);try{const c=e.parse("object"==typeof a?a[e.name]:void 0);void 0!==c&&Object.assign(b,{[e.name]:c})}catch(a){a instanceof i&&0<a.errors.length?c.push(...a.errors):c.push(a)}}),0<c.length)throw new i(`Data is not valid`,{errors:c});return 0<Object.keys(b).length?b:void 0}throwError(a,{errors:b,value:c}={}){throw new i(a,{errors:b,value:c,field:this})}}return a.Schema=k,a.Transformers=j,a.Utils=h,a.ValidationError=i,a}({});
