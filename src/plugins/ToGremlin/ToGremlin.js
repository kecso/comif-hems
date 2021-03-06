/*globals define*/
/*eslint-env node, browser*/

/**
 * Generated by PluginGenerator 2.16.0 from webgme on Thu May 03 2018 22:34:55 GMT-0500 (Central Daylight Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'ejs',
    'text!./queries.txt',
    'text!./meta.ejs',
    'text!./node.ejs',
    'text!./values.ejs'
], function (PluginConfig,
             pluginMetadata,
             PluginBase,
             ejs,
             QUERIES,
             metaTemplate,
             nodeTemplate,
             valueTemplate) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of ToGremlin.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ToGremlin.
     * @constructor
     */
    var ToGremlin = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    ToGremlin.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    ToGremlin.prototype = Object.create(PluginBase.prototype);
    ToGremlin.prototype.constructor = ToGremlin;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    ToGremlin.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            artifact,
            concept,
            conceptObject,
            nodeObject,
            nodes = {},
            keys, i, j, k, target, meta, owner,
            p2c = {},
            p2n = {},
            parameters = {},
            gremlin = '';

        function collectBases(node) {
            var bases = [], metaNode;
            for (metaNode in self.META) {
                if (self.core.isTypeOf(node, self.META[metaNode])) {
                    bases.push(metaNode);
                }
            }
            return bases;
        }

        nodeObject = self.activeNode;

        for (concept in self.META) {
            p2c[self.core.getPath(self.META[concept])] = concept;
            p2n[self.core.getPath(self.META[concept])] = self.META[concept];
        }

        parameters.name = self.core.getAttribute(nodeObject, 'name');
        parameters.concepts = [];
        for (concept in self.META) {
            conceptObject = {
                name: concept,
                attr: {},
                ptr: {},
                set: {},
                bases: []
            };

            keys = self.core.getOwnValidAttributeNames(self.META[concept]);
            for (i = 0; i < keys.length; i += 1) {
                conceptObject.attr[keys[i]] = self.core.getAttributeMeta(self.META[concept], keys[i]).type || 'string';
            }

            keys = self.core.getOwnValidPointerNames(self.META[concept]);
            for (i = 0; i < keys.length; i += 1) {
                //TODO merge all together for better quality
                conceptObject.ptr[keys[i]] = p2c[self.core.getOwnValidTargetPaths(self.META[concept], keys[i])[0]];
                if (!conceptObject.ptr[keys[i]]) {
                    delete conceptObject.ptr[keys[i]];
                }
            }

            keys = self.core.getOwnValidSetNames(self.META[concept]);
            for (i = 0; i < keys.length; i += 1) {
                target = p2c[self.core.getOwnValidTargetPaths(self.META[concept], keys[i])[0]];
                if (target) {
                    meta = self.core.getPointerMeta(self.META[concept], keys[i]);
                    for (j in meta) {
                        if (p2c[j] == target) {
                            conceptObject.set[keys[i]] = {
                                target: target,
                                md: {min: meta[j].min, max: meta[j].max}
                            }
                        }
                    }
                }
            }

            keys = self.core.getMixinPaths(self.META[concept]);
            for (i = 0; i < keys.length; i += 1) {
                conceptObject.bases.push(p2c[keys[i]])
            }
            if (self.core.getBase(self.META[concept])) {
                conceptObject.bases.push(p2c[self.core.getPath(self.core.getBase(self.META[concept]))]);
            }
            parameters.concepts.push(conceptObject);
        }

        gremlin += ejs.render(metaTemplate, parameters);
        self.core.loadSubTree(nodeObject, function (err, nodes) {
            var values = {string: [], integer: [], float: [], asset: []},
                paramNodes = {};
            if (err) {
                self.result.setSuccess(false);
                callback(err, self.result);
                return;
            }

            p2n[self.core.getPath(nodeObject)] = nodeObject;
            for (i = 0; i < nodes.length; i += 1) {
                p2n[self.core.getPath(nodes[i])] = nodes[i];
            }

            for (i = 0; i < nodes.length; i += 1) {
                parameters = {attr: {}, ptr: {}, set: {}};
                parameters.path = self.core.getPath(nodes[i]);
                parameters.metaType = p2c[self.core.getPath(self.core.getMetaType(nodes[i]))];
                //attr
                keys = self.core.getValidAttributeNames(nodes[i]);
                for (j = 0; j < keys.length; j += 1) {
                    owner = self.core.getAttributeDefinitionOwner(nodes[i], keys[j]);
                    meta = self.core.getAttributeMeta(owner, keys[j]).type || 'string';
                    target = '' + self.core.getAttribute(nodes[i], keys[j]);
                    k = values[meta].indexOf(target);
                    if (k === -1) {
                        k = values[meta].length;
                        values[meta].push(target);
                    }
                    parameters.attr[keys[j]] = {
                        owner: self.core.getAttribute(owner, 'name'),
                        type: meta,
                        valueIndex: k
                    };


                }
                //ptr
                keys = self.core.getValidPointerNames(nodes[i]);
                for (j = 0; j < keys.length; j += 1) {
                    target = p2n[self.core.getPointerPath(nodes[i], keys[j])];
                    if (target) {
                        owner = self.core.getPointerDefinitionInfo(nodes[i], keys[j], target);
                        parameters.ptr[keys[j]] = {
                            owner: p2c[owner.ownerPath],
                            target: self.core.getPointerPath(nodes[i], keys[j])
                        };
                    }
                }
                //set
                keys = self.core.getValidSetNames(nodes[i]);
                for (j = 0; j < keys.length; j += 1) {
                    parameters.set[keys[j]] = {};
                    target = self.core.getMemberPaths(nodes[i], keys[j]);
                    for (k = 0; k < target.length; k += 1) {
                        owner = self.core.getSetDefinitionInfo(nodes[i], keys[j], target[k]);
                        parameters.set[keys[j]][target[k]] = p2c[owner.ownerPath];
                    }
                }

                // parameters.values = values;
                // gremlin += ejs.render(nodeTemplate, parameters);
                parameters.bases = collectBases(nodes[i]);
                // console.log(parameters);
                paramNodes[parameters.path] = JSON.parse(JSON.stringify(parameters));
            }
            gremlin += ejs.render(valueTemplate, {values: values});

            gremlin += ejs.render(nodeTemplate, {nodes: paramNodes, values: values});

            gremlin += QUERIES;

            artifact = self.blobClient.createArtifact('MyArtifact');

            artifact.addFiles({'model.groovy': gremlin})
                .then(function (fileMetadataHashes) {
                    self.result.addArtifact(fileMetadataHashes[0]);
                    // and/or save the full artifact and link to it (will be a zip file).
                    return artifact.save();
                })
                .then(function (artifactHash) {
                    self.result.addArtifact(artifactHash);
                    self.result.setSuccess(true);
                    callback(null, self.result);
                })
                .catch(function (err) {
                    callback(err);
                });
        });
    };

    return ToGremlin;
});
