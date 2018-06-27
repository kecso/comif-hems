/*globals define*/
/*eslint-env node, browser*/

/**
 * Generated by PluginGenerator 2.16.0 from webgme on Wed Jun 27 2018 11:03:44 GMT-0500 (Central Daylight Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'plugin/PluginMessage',
    'comif-hems/clientUtils',
    'text!comif-hems/domain.txt'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    PluginMessage,
    utils,
    domainTxt) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of FormulaConformanceCheck.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin FormulaConformanceCheck.
     * @constructor
     */
    var FormulaConformanceCheck = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    FormulaConformanceCheck.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    FormulaConformanceCheck.prototype = Object.create(PluginBase.prototype);
    FormulaConformanceCheck.prototype.constructor = FormulaConformanceCheck;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    FormulaConformanceCheck.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            exec = require('child_process').exec,
            fs = require('fs'),
            filename = self._getRandomFileName();

        self._createProjectFile(function (err, projectFile) {
            if (err) {
                self.logger.error(err);
                self.result.setSuccess(false);
                callback(null, self.result);
                return;
            }

            fs.writeFileSync(filename, projectFile, 'utf8');

            exec('FormulaLive ' + filename, {}, function (err, stdout, stderr) {
                fs.unlinkSync(filename);
                if (err) {
                    self.logger.error(err);
                    self.result.setSuccess(false);
                    callback(null, self.result);
                    return;
                }
                // self.result.addMessage(new PluginMessage({message: stderr, severity: 'error'}));
                self.result.addMessage(new PluginMessage({message: stdout, severity: 'info'}));
                self.result.setSuccess(stdout.indexOf('Truth value: true') !== -1);
                callback(null, self.result);
            });

        });

    };

    FormulaConformanceCheck.prototype._createProjectFile = function (callback) {
        var self = this,
            core = self.core,
            path = core.getPath(self.activeNode),
            root = core.getRoot(self.activeNode),
            name = core.getAttribute(self.activeNode, 'name'),
            input = self.getCurrentConfig().formulaProjectFile;

        if (input) {
            input = utils.getFormulaCommands(name) + input;
            callback(null, input);
            return;
        }

        input = utils.getFormulaCommands(name);
        input += domainTxt;
        input += core.getAttribute(self.activeNode, '_formula_constraints') || '\n';
        input += ' //// End of user defined extra constraints\n}\n\n';
        input += utils.getMetaData(core, root, name);
        utils.getNodeData(core, root, path, name, function (err, nodeData) {
            if (err) {
                callback(err);
            } else {
                input += nodeData;
            }
            callback(null, input);
        });

    };

    FormulaConformanceCheck.prototype._getRandomFileName = function () {
        var chars = 'abcdefghijklmnopqrstuvxyzw',
            length = 8,
            name = '';

        while (length--) {
            name += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return name + '.4ml';
    };

    return FormulaConformanceCheck;
});
