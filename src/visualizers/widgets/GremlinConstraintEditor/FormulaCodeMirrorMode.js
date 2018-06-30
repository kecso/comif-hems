/**
 * @author imadari / https://github.com/imadari
 * @author kecso / https://github.com/kecso
 */

define([
    'codemirror/lib/codemirror',
    'css!codemirror/lib/codemirror.css',
    'css!codemirror/theme/monokai.css'
], function (CodeMirror) {
    'use strict';

    CodeMirror.defineMode("formula", function () {

        var keywords = ["domain", "model", "extends", "transform", "at", "return", "new", "no", "is"];
        var operators = [":-", ":=", "::=", ":", ";", "\\+", "="];
        var typesAndAtoms = ["Integer", "String", "Boolean", "TRUE", "FALSE", "null", "Real"];

        return {
            startState: function () {
                return {
                    inDomain: false,
                    inUses: false,
                    endUses: false,
                    inModel: false,
                    inTransformation: false,
                    previousChar: ''
                };
            },

            token: function (stream, state) {
                // First, we are checking the uses part

                var ch = stream.peek();

                if (ch == '{' || ch == '}') {
                    state.previousChar = ch;
                    stream.next();
                    return "bracket";
                }
                /*if (!state.endUses) {
                 if (ch == '[' && !state.inUses) {
                 state.inUses = true;
                 }
                 else if (ch == ']' && state.inUses) {
                 state.inUses = false;
                 state.endUses = true;
                 return "string";
                 }

                 if (state.inUses == true) {
                 return "string";
                 }
                 }*/
                // End uses

                // Line comments
                if (stream.match("//")) {
                    stream.skipToEnd();
                    return "comment";
                }

                //::= definitions
                var defRegex = new RegExp("(\\b\\w+?\\b)\\s*::=", "");
                var matches = stream.match(defRegex, false);
                if (matches != null) {
                    stream.match(matches[1], true);
                    return "def";
                }

                //:- Rules
                var ruleRegex = /(\w+?) *:-/; //new RegExp("(.+?)\\s*:-", "");
                var matches = stream.match(ruleRegex, false);
                if (matches != null) {
                    stream.match(matches[1], true);
                    return "def";
                }

                //Keywords
                for (var i = 0; i < keywords.length; i++) {
                    // TODO: Rewrite with regex
                    if ($.inArray(state.previousChar, [" ", ",", ".", ";", "(", ")", ""]) == -1) break;
                    var re = new RegExp("(" + keywords[i] + ")(?=([\\s,\\.;()]|$))", "");
                    var matches = stream.match(re, true);
                    if (matches != null)
                        return "keyword";
                }

                // Types
                for (var i = 0; i < typesAndAtoms.length; i++) {
                    // TODO: Rewrite with regex
                    if ($.inArray(state.previousChar, [" ", ",", ".", ";", "(", ")", "{"]) == -1) break;
                    var re = new RegExp("(" + typesAndAtoms[i] + ")(?=([\\s,\\.;()}]|$))", "");
                    var matches = stream.match(re, true);
                    if (matches != null)
                        return "atom";
                }

                // Operators
                for (var i = 0; i < operators.length; i++) {
                    var re = new RegExp(operators[i], "");
                    var matches = stream.match(re, true);
                    if (matches != null)
                        return "operator";
                }

                // Strings
                var stringRegex = new RegExp('".+?"', "");
                matches = stream.match(stringRegex, true);
                if (matches != null)
                    return "string";

                state.previousChar = ch;
                stream.next();
                return null;
            }
        };
    });

    return CodeMirror;
});
