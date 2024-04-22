import {app} from "../../../scripts/app.js";


app.registerExtension({
    name: "TyDev-Utils.Reroute",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        const getSlotMenuOptions = nodeType.prototype.getSlotMenuOptions;
        nodeType.prototype.getSlotMenuOptions = function (slot) {

            // region Copy From litegraph.core.js
            var menuInfo = [];
            if (getSlotMenuOptions) {
                menuInfo = getSlotMenuOptions.apply(this, slot);
            } else {
                if (
                    slot &&
                    slot.output &&
                    slot.output.links &&
                    slot.output.links.length
                ) {
                    menuInfo.push({content: "Disconnect Links", slot: slot});
                }
                var _slot = slot.input || slot.output;
                if (_slot.removable) {
                    menuInfo.push(
                        _slot.locked
                            ? "Cannot remove"
                            : {content: "Remove Slot", slot: slot}
                    );
                }
                if (!_slot.nameLocked) {
                    menuInfo.push({content: "Rename Slot", slot: slot});
                }
            }
            // endregion

            if (
                slot &&
                slot.output &&
                slot.output.links &&
                slot.output.links.length
            ) {
                menuInfo.push({
                    content: 'Reroute',
                    slot: slot,
                    callback: async (value, options, event, parentMenu, node) => {
                        const slot = value.slot;
                        node.graph.beforeChange();
                        if (
                            slot &&
                            slot.output &&
                            slot.output.links &&
                            slot.output.links.length
                        ) {
                            const rerouteNode = LiteGraph.createNode("Reroute");
                            app.graph.add(rerouteNode);
                            rerouteNode.pos = [
                                node.pos[0] + node.size[0] + 40,
                                node.pos[1]
                            ];
                            app.canvas.selectNode(rerouteNode, false);
                            node.connect(slot.slot, rerouteNode, 0);
                            const linkInfos = [];
                            for (var i = 0, l = slot.output.links.length; i < l; i++) {
                                var linkId = slot.output.links[i];
                                var linkInfo = node.graph.links[linkId];
                                if (!linkInfo) {
                                    continue;
                                }
                                linkInfos.push(linkInfo);
                            }
                            linkInfos.forEach(function (linkInfo) {
                                var targetNode = node.graph.getNodeById(linkInfo.target_id);
                                rerouteNode.connect(0, targetNode, linkInfo.target_slot);
                            })
                        }
                        node.graph.afterChange();
                        node.setDirtyCanvas(true, true);
                    }
                })
            }

            return menuInfo;
        };
    }
});

