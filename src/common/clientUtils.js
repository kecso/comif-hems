/**
 * @author kecso / https://github.com/kecso
 */
/*globals define*/
/*eslint-env browser*/

define([
    'ejs',
    'text!./meta.formula.ejs',
    'text!./node.formula.ejs',
    'text!./values.formula.ejs'
], function (ejs, metaTemplate, nodeTemplate, valueTemplate) {
    'use strict';

    function getMetaData(core, root, name) {
        var metaNodes = core.getAllMetaNodes(root),
            conceptObject,
            concept,
            p2c = {},
            p2n = {},
            keys, i, j, target, meta,
            parameters = {};

        for (concept in metaNodes) {
            p2c[concept] = core.getAttribute(metaNodes[concept], 'name');
            p2n[concept] = metaNodes[concept];
        }

        parameters.name = name;
        parameters.concepts = [];
        for (concept in metaNodes) {
            conceptObject = {
                name: p2c[concept],
                attr: {},
                ptr: {},
                set: {},
                bases: []
            };

            keys = core.getOwnValidAttributeNames(metaNodes[concept]);
            for (i = 0; i < keys.length; i += 1) {
                conceptObject.attr[keys[i]] = core.getAttributeMeta(metaNodes[concept], keys[i]).type || 'string';
            }

            keys = core.getOwnValidPointerNames(metaNodes[concept]);
            for (i = 0; i < keys.length; i += 1) {
                //TODO merge all together for better quality
                target = core.getOwnValidTargetPaths(metaNodes[concept], keys[i]);
                for (j = 0; j < target.length; j += 1) {
                    target[j] = p2c[target[j]];
                }
                conceptObject.ptr[keys[i]] = target;
                if (conceptObject.ptr[keys[i]].length === 0) {
                    delete conceptObject.ptr[keys[i]];
                }
            }

            keys = core.getOwnValidSetNames(metaNodes[concept]);
            for (i = 0; i < keys.length; i += 1) {
                target = p2c[core.getOwnValidTargetPaths(metaNodes[concept], keys[i])[0]];
                if (target) {
                    meta = core.getPointerMeta(metaNodes[concept], keys[i]);
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

            keys = core.getMixinPaths(metaNodes[concept]);
            for (i = 0; i < keys.length; i += 1) {
                conceptObject.bases.push(p2c[keys[i]])
            }
            if (core.getBase(metaNodes[concept])) {
                conceptObject.bases.push(p2c[core.getPath(core.getBase(metaNodes[concept]))]);
            }
            parameters.concepts.push(conceptObject);
        }

        return ejs.render(metaTemplate, parameters);
    }

    function getNodeData(core, root, path, name, callback) {
        var metaNodes = core.getAllMetaNodes(root),
            nodeObject,
            conceptObject,
            concept,
            p2c = {},
            p2n = {},
            keys, i, j, k, target, meta, owner,
            result = '',
            parameters = {};

        for (concept in metaNodes) {
            p2c[concept] = core.getAttribute(metaNodes[concept], 'name');
            p2n[concept] = metaNodes[concept];
        }

        core.loadByPath(root, path, function (err, nodeObject) {
            if (err) {
                callback(err);
                return;
            }

            core.loadSubTree(nodeObject, function (err, nodes) {
                var values = {string: [], integer: [], float: [], asset: []};
                if (err) {
                    callback(err);
                    return;
                }

                p2n[core.getPath(nodeObject)] = nodeObject;
                for (i = 0; i < nodes.length; i += 1) {
                    p2n[core.getPath(nodes[i])] = nodes[i];
                }

                for (i = 0; i < nodes.length; i += 1) {
                    parameters = {attr: {}, ptr: {}, set: {}};
                    parameters.path = core.getPath(nodes[i]);
                    parameters.metaType = p2c[core.getPath(core.getMetaType(nodes[i]))];
                    //attr
                    keys = core.getValidAttributeNames(nodes[i]);
                    for (j = 0; j < keys.length; j += 1) {
                        owner = core.getAttributeDefinitionOwner(nodes[i], keys[j]);
                        meta = core.getAttributeMeta(owner, keys[j]).type || 'string';
                        target = '' + core.getAttribute(nodes[i], keys[j]);
                        k = values[meta].indexOf(target);
                        if (k === -1) {
                            k = values[meta].length;
                            values[meta].push(target);
                        }
                        parameters.attr[keys[j]] = {
                            owner: core.getAttribute(owner, 'name'),
                            type: meta,
                            valueIndex: k
                        };

                    }
                    //ptr
                    keys = core.getValidPointerNames(nodes[i]);
                    for (j = 0; j < keys.length; j += 1) {
                        target = p2n[core.getPointerPath(nodes[i], keys[j])];
                        if (target) {
                            owner = core.getPointerDefinitionInfo(nodes[i], keys[j], target);
                            parameters.ptr[keys[j]] = {
                                owner: p2c[owner.ownerPath],
                                target: core.getPointerPath(nodes[i], keys[j])
                            };
                        }
                    }
                    //set
                    keys = core.getValidSetNames(nodes[i]);
                    for (j = 0; j < keys.length; j += 1) {
                        parameters.set[keys[j]] = {};
                        target = core.getMemberPaths(nodes[i], keys[j]);
                        for (k = 0; k < target.length; k += 1) {
                            owner = core.getSetDefinitionInfo(nodes[i], keys[j], target[k]);
                            parameters.set[keys[j]][target[k]] = p2c[owner.ownerPath];
                        }
                    }

                    parameters.values = values;
                    result += ejs.render(nodeTemplate, parameters);
                }

                result += ejs.render(valueTemplate, {values: values});

                result += '\n}\n';

                callback(null, result);
            });
        });
    }

    return {
        getMetaData: getMetaData,
        getNodeData: getNodeData
    }
});
