/*
 * This file is part of EspoCRM and/or AtroCore.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2019 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: http://www.espocrm.com
 *
 * AtroCore is EspoCRM-based Open Source application.
 * Copyright (C) 2020 AtroCore UG (haftungsbeschränkt).
 *
 * AtroCore as well as EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AtroCore as well as EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word
 * and "AtroCore" word.
 */

Espo.define('views/record/detail-side', ['view'], function (Dep) {

    return Dep.extend({

        template: 'record/side',

        mode: 'detail',

        readOnly: false,

        inlineEditDisabled: false,

        defaultPanel: true,

        streamPanel: true,

        panelList: [],

        defaultPanelDefs: {
            name: 'default',
            label: 'Ownership Information',
            view: 'views/record/panels/default-side',
            isForm: true,
            options: {
                fieldList: [
                    {
                        name: ':ownerUser'
                    },
                    {
                        name: ':assignedUser'
                    },
                    {
                        name: 'teams'
                    },
                    {
                        name: 'assignedAccounts'
                    }
                ]
            }
        },

        data: function () {
            return {
                panelList: this.panelList,
                scope: this.scope,
                entityType: this.entityType
            };
        },

        events: {
            'click .action': function (e) {
                var $target = $(e.currentTarget);
                var action = $target.data('action');
                var panel = $target.data('panel');
                var data = $target.data();
                if (action) {
                    var method = 'action' + Espo.Utils.upperCaseFirst(action);
                    var d = _.clone(data);
                    delete d['action'];
                    delete d['panel'];
                    var view = this.getView(panel);
                    if (view && typeof view[method] == 'function') {
                        view[method].call(view, d);
                    }
                }
            },
        },

        init: function () {
            this.panelList = this.options.panelList || this.panelList;
            this.scope = this.entityType = this.options.model.name;

            this.recordHelper = this.options.recordHelper;

            this.panelList = Espo.Utils.clone(this.panelList);

            this.readOnlyLocked = this.options.readOnlyLocked || this.readOnly;
            this.readOnly = this.options.readOnly || this.readOnly;
            this.inlineEditDisabled = this.options.inlineEditDisabled || this.inlineEditDisabled;

            this.recordViewObject = this.options.recordViewObject;
        },

        setupPanels: function () {
        },

        setup: function () {
            this.type = this.mode;
            if ('type' in this.options) {
                this.type = this.options.type;
            }

            if (this.defaultPanel) {
                this.setupDefaultPanel();
            }

            this.setupPanels();

            var additionalPanels = this.getMetadata().get('clientDefs.' + this.scope + '.sidePanels.' + this.type) || [];
            additionalPanels.forEach(function (panel) {
                this.panelList.push(panel);
            }, this);

            this.panelList = this.panelList.filter(function (p) {
                if (p.aclScope) {
                    if (!this.getAcl().checkScope(p.aclScope)) {
                        return;
                    }
                }
                if (p.accessDataList) {
                    if (!Espo.Utils.checkAccessDataList(p.accessDataList, this.getAcl(), this.getUser())) {
                        return false;
                    }
                }
                return true;
            }, this);

            this.panelList = this.panelList.map(function (p) {
                var item = Espo.Utils.clone(p);
                if (this.recordHelper.getPanelStateParam(p.name, 'hidden') !== null) {
                    item.hidden = this.recordHelper.getPanelStateParam(p.name, 'hidden');
                } else {
                    this.recordHelper.setPanelStateParam(p.name, item.hidden || false);
                }
                return item;
            }, this);

            this.wait(true);
            this.getHelper().layoutManager.get(this.scope, 'sidePanels' + Espo.Utils.upperCaseFirst(this.type), function (layoutData) {
                if (layoutData) {
                    this.alterPanels(layoutData);
                }

                if (this.streamPanel && this.getMetadata().get('scopes.' + this.scope + '.stream') && this.getConfig().get('isStreamSide') && !this.model.isNew()) {
                    this.setupStreamPanel();
                }

                this.setupPanelViews();
                this.wait(false);
            }.bind(this));
        },

        alterPanels: function (layoutData) {
            layoutData = layoutData || {};

            var newList = [];
            this.panelList.forEach(function (item, i) {
                item.index = i;
                if (item.name) {
                    var itemData = layoutData[item.name] || {};
                    if (itemData.disabled) return;
                    for (var i in itemData) {
                        item[i] = itemData[i];
                    }
                }

                newList.push(item);
            }, this);

            newList.sort(function (v1, v2) {
                return v1.index - v2.index;
            });

            this.panelList = newList;
        },

        setupDefaultPanel: function () {
            this.defaultPanelDefs = Espo.Utils.cloneDeep(this.defaultPanelDefs);

            let scopeDefs = this.getMetadata().get(['scopes', this.scope]) || {};

            this.defaultPanelDefs.options.fieldList = this.defaultPanelDefs.options.fieldList.filter(fieldDefs => {
                return (scopeDefs.hasOwner && fieldDefs.name === ':ownerUser' && this.getAcl().check('User', 'read'))
                    || (scopeDefs.hasAssignedUser && fieldDefs.name === ':assignedUser' && this.getAcl().check('User', 'read'))
                    || (scopeDefs.hasTeam && fieldDefs.name === 'teams' && this.getAcl().check('Team', 'read'))
                    || (scopeDefs.hasAccount && fieldDefs.name === 'assignedAccounts' && this.getAcl().check('Account', 'read'));
            });

            let hasAnyField = (this.defaultPanelDefs.options.fieldList || []).some(fieldDefs => {
                if ((fieldDefs.name === ':ownerUser' && this.model.hasLink('ownerUser')) || (fieldDefs.name === ':assignedUser' && (this.model.hasLink('assignedUsers') || this.model.hasLink('assignedUser')))) {
                    return true;
                } else {
                    return this.model.hasLink(fieldDefs.name)
                }
            });
            if (this.mode === 'detail' || hasAnyField) {
                var met = false;
                this.panelList.forEach(function (item) {
                    if (item.name === 'default') {
                        met = true;
                    }
                }, this);

                if (met) return;

                var defaultPanelDefs = this.getMetadata().get(['clientDefs', this.scope, 'defaultSidePanel', this.type]);

                if (defaultPanelDefs === false) return;

                if (this.getMetadata().get(['clientDefs', this.scope, 'defaultSidePanelDisabled'])) return;

                defaultPanelDefs = defaultPanelDefs || this.defaultPanelDefs;

                if (!defaultPanelDefs) return;

                defaultPanelDefs = Espo.Utils.cloneDeep(defaultPanelDefs);

                var fieldList = this.getMetadata().get(['clientDefs', this.scope, 'defaultSidePanelFieldLists', this.type]);

                if (fieldList) {
                    defaultPanelDefs.options = defaultPanelDefs.options || {};
                    defaultPanelDefs.options.fieldList = fieldList;
                }

                if (defaultPanelDefs.options.fieldList && defaultPanelDefs.options.fieldList.length) {
                    defaultPanelDefs.options.fieldList.forEach(function (item, i) {
                        if (typeof item !== 'object') {
                            item = {
                                name: item
                            }
                            defaultPanelDefs.options.fieldList[i] = item;
                        }
                        if (item.name === ':ownerUser') {
                            if (this.model.hasField('ownerUser')) {
                                item.name = 'ownerUser';
                            } else {
                                defaultPanelDefs.options.fieldList[i] = {};
                            }
                        }

                        if (item.name === ':assignedUser') {
                            if (this.model.hasField('assignedUsers')) {
                                item.name = 'assignedUsers';
                                if (!this.model.getFieldParam('assignedUsers', 'view')) {
                                    item.view = 'views/fields/assigned-users';
                                }
                            } else if (this.model.hasField('assignedUser')) {
                                item.name = 'assignedUser';
                            } else {
                                defaultPanelDefs.options.fieldList[i] = {};
                            }
                        }
                    }, this);
                }

                this.panelList.unshift(defaultPanelDefs);
            }
        },

        setupStreamPanel: function () {
            var streamAllowed = this.getAcl().checkModel(this.model, 'stream', true);
            if (streamAllowed === null) {
                this.listenToOnce(this.model, 'sync', function () {
                    streamAllowed = this.getAcl().checkModel(this.model, 'stream', true);
                    if (streamAllowed) {
                        this.showPanel('stream', function () {
                            this.getView('stream').collection.fetch();
                        });
                    }
                }, this);
            }
            if (streamAllowed !== false) {
                this.panelList.push({
                    "name": "stream",
                    "label": "Stream",
                    "view": "views/stream/panel",
                    "hidden": !streamAllowed
                });
            }
        },

        setupPanelViews: function () {
            this.panelList.forEach(function (p) {
                var o = {
                    model: this.options.model,
                    el: this.options.el + ' .panel[data-name="' + p.name + '"] > .panel-body',
                    readOnly: this.readOnly,
                    inlineEditDisabled: this.inlineEditDisabled,
                    mode: this.mode,
                    recordHelper: this.recordHelper,
                    defs: p,
                    disabled: p.hidden || false,
                    recordViewObject: this.recordViewObject
                };
                o = _.extend(o, p.options);
                this.createView(p.name, p.view, o, function (view) {
                    if ('getButtonList' in view) {
                        p.buttonList = this.filterActions(view.getButtonList());
                    }
                    if ('getActionList' in view) {
                        p.actionList = this.filterActions(view.getActionList());
                    }
                    if (p.label) {
                        p.title = this.translate(p.label, 'labels', this.scope);
                    } else {
                        p.title = view.title;
                    }
                    if (view.titleHtml) {
                        p.titleHtml = view.titleHtml;
                    }
                }, this);
            }, this);
        },

        getFieldViews: function (withHidden) {
            var fields = {};
            this.panelList.forEach(function (p) {
                var panelView = this.getView(p.name);
                if ((!panelView.disabled || withHidden) && 'getFieldViews' in panelView) {
                    fields = _.extend(fields, panelView.getFieldViews());
                }
            }, this);
            return fields;
        },

        getFields: function () {
            return this.getFieldViews();
        },

        fetch: function () {
            var data = {};

            this.panelList.forEach(function (p) {
                var panelView = this.getView(p.name);
                if (!panelView.disabled && 'fetch' in panelView) {
                    data = _.extend(data, panelView.fetch());
                }
            }, this);
            return data;
        },

        filterActions: function (actions) {
            var filtered = [];
            actions.forEach(function (item) {
                if (Espo.Utils.checkActionAccess(this.getAcl(), this.model, item)) {
                    filtered.push(item);
                }
            }, this);
            return filtered;
        },

        showPanel: function (name, callback) {
            this.recordHelper.setPanelStateParam(name, 'hidden', false);

            var isFound = false;
            this.panelList.forEach(function (d) {
                if (d.name == name) {
                    d.hidden = false;
                    isFound = true;
                }
            }, this);
            if (!isFound) return;

            if (this.isRendered()) {
                var view = this.getView(name);
                if (view) {
                    view.$el.closest('.panel').removeClass('hidden');
                    view.disabled = false;
                }
                if (callback) {
                    callback.call(this);
                }
            } else {
                if (callback) {
                    this.once('after:render', function () {
                        callback.call(this);
                    }, this);
                }
            }
        },

        hidePanel: function (name, callback) {
            this.recordHelper.setPanelStateParam(name, 'hidden', true);

            var isFound = false;
            this.panelList.forEach(function (d) {
                if (d.name == name) {
                    d.hidden = true;
                    isFound = true;
                }
            }, this);
            if (!isFound) return;

            if (this.isRendered()) {
                var view = this.getView(name);
                if (view) {
                    view.$el.closest('.panel').addClass('hidden');
                    view.disabled = true;
                }
                if (callback) {
                    callback.call(this);
                }
            } else {
                if (callback) {
                    this.once('after:render', function () {
                        callback.call(this);
                    }, this);
                }
            }
        }

    });
});
