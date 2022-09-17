// GENERAL
window.isEmptyObj = function (object) {
    checkIfMapping(object);

    for (const KEY in object) {
        if (object.hasOwnProperty(KEY)) {
            return false;
        }
    }
    return true;
};

window.getObjKeys = function (object) {
    checkIfMapping(object);

    let keysArray = [];

    for (const KEY in object) {
        keysArray.push(KEY);
    }
    return keysArray;
};

window.getObjKeysAndValues = function (object) {
    let keysAndValuesArray = [];
    const OBJECT_KEYS_ARRAY = getObjKeys(object); // type check is already here
    const NUMBER_OF_KEYS = OBJECT_KEYS_ARRAY.length;

    for (let i=0; i < NUMBER_OF_KEYS; i++) {
        const CURRENT_KEY = OBJECT_KEYS_ARRAY[i];
        keysAndValuesArray.push(CURRENT_KEY, object[CURRENT_KEY]);
    }
    return keysAndValuesArray;
};

window.isString = function (object) {
    return typeof(object) === 'string';
};

window.checkIfString = function (object, message) {
    if (isString(object) === false) {
        if (isInvalidErrorMessage(message)) {
            message = "Not a string";
        }

        throw TypeError(message);
    }
};

window.isHTMLElement = function (element) {
    return element instanceof Element;
};

window.checkIfHTMLElement = function (element, message) {
    if (isHTMLElement(element) === false) {
        if (isInvalidErrorMessage(message)) {
            message = "Not a HTML element";
        }

        throw TypeError(message);
    }
};

window.isMapping = function (object) {
    return object.constructor === Object;
};

window.checkIfMapping = function (object, message) {
    if (isMapping(object) === false) {
        if (isInvalidErrorMessage(message)) {
            message = "Not a mapping";
        }

        throw TypeError(message);
    }
};

window.isArray = function (array) {
    return array.constructor === Array || array.constructor === HTMLCollection;
};

window.checkIfArray = function (array, message) {
    if (isArray(array) === false) {
        if (isInvalidErrorMessage(message)) {
            message = "Not an array";
        }

        throw TypeError(message);
    }
};

window.isStylesMapping = function (styles) {
    return styles.constructor === CSSStyleDeclaration;
};

window.checkIfStylesMapping = function (styles, message) {
    if (isStylesMapping(styles) === false) {
        if (isInvalidErrorMessage(message)) {
            message = "Not a mapping of CSS styles";
        }

        return TypeError(message);
    }
};

window.isNumber = function (number) {
    return typeof(number) === 'number';
};

window.checkIfNumber = function (number, message) {
    if (isNumber(number) === false) {
        if (isInvalidErrorMessage(message)) {
            message = "Not a number";
        }

        throw TypeError(message);
    }
};

window.isBoolean = function (boolean) {
    return typeof(boolean) === 'boolean';
};



// TESTING/DEBUGGING
window.getPerformanceSpeed = function (startingTime) {
    console.log(`${performance.now() - startingTime} ms`);
};