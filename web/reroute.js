import {app} from "../../../scripts/app.js";


app.registerExtension({
    name: "TyDev-Utils.Reroute",
    addRerouteMenu(nodeType) {
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
                    callback: (value, options, event, parentMenu, node) => {
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
    },
    setup() {
        for (const nodeType of Object.values(LiteGraph.registered_node_types)) {
            this.addRerouteMenu(nodeType);
        }
    },
});

const deleteSelectedNodes = LGraphCanvas.prototype.deleteSelectedNodes;
LGraphCanvas.prototype.deleteSelectedNodes = function () {

    this.graph.beforeChange();

    for (var i in this.selected_nodes) {
        var node = this.selected_nodes[i];
        if (node.type != "Reroute") {
            continue;
        }
        if (node.block_delete) {
            continue;
        }
        if(node.inputs && node.inputs.length && node.outputs && node.outputs.length && LiteGraph.isValidConnection( node.inputs[0].type, node.outputs[0].type ) && node.inputs[0].link && node.outputs[0].links && node.outputs[0].links.length )
        {
            var input_link = node.graph.links[ node.inputs[0].link ];
            var output_links = node.outputs[0].links.map(function (link_id) {
                return node.graph.links[link_id]
            })
            var input_node = node.getInputNode(0);
            var output_nodes = node.getOutputNodes(0);

            if (input_node && output_nodes) {
                for (var outputIndex = 0; outputIndex < output_nodes.length; ++outputIndex) {
                    const output_node =  output_nodes[outputIndex];
                    const output_link = output_links[outputIndex];
                    input_node.connect( input_link.origin_slot, output_node, output_link.target_slot );
                }
            }
        }
        this.graph.remove(node);
        if (this.onNodeDeselected) {
            this.onNodeDeselected(node);
        }
        delete this.selected_nodes[i];
    }

    // this.selected_nodes = {};
    this.current_node = null;
    this.highlighted_links = {};
    this.setDirty(true);
    this.graph.afterChange();

    deleteSelectedNodes.apply(this);
}