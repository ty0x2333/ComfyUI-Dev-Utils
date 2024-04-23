import {api} from "../../../scripts/api.js";
import {app} from "../../../scripts/app.js";
import {$el} from "../../scripts/ui.js";

// region: Refresh Timer
let refreshTimer = null;

function stopRefreshTimer() {
    if (!refreshTimer) {
        return;
    }
    clearInterval(refreshTimer);
    refreshTimer = null;
}

function startRefreshTimer() {
    stopRefreshTimer();
    refreshTimer = setInterval(function () {
        app.graph.setDirtyCanvas(true, false);
    }, 100);
}


// endregion

function formatExecutionTime(time) {
    return `${(time / 1000.0).toFixed(2)}s`
}

// Reference: https://github.com/ltdrdata/ComfyUI-Manager/blob/main/js/comfyui-manager.js
function drawBadge(node, orig, restArgs) {
    let ctx = restArgs[0];
    const r = orig?.apply?.(node, restArgs);

    if (!node.flags.collapsed && node.constructor.title_mode != LiteGraph.NO_TITLE) {
        let text = "";
        if (node.ty_et_execution_time !== undefined) {
            text = formatExecutionTime(node.ty_et_execution_time);
        } else if (node.ty_et_start_time !== undefined) {
            text = formatExecutionTime(LiteGraph.getTime() - node.ty_et_start_time);
        }
        if (!text) {
            return
        }
        let fgColor = "white";
        let bgColor = "#0F1F0F";
        let visible = true;

        ctx.save();
        ctx.font = "12px sans-serif";
        const textSize = ctx.measureText(text);
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        const paddingHorizontal = 6;
        ctx.roundRect(0, -LiteGraph.NODE_TITLE_HEIGHT - 20, textSize.width + paddingHorizontal * 2, 20, 5);
        ctx.fill();

        ctx.fillStyle = fgColor;
        ctx.fillText(text, paddingHorizontal, -LiteGraph.NODE_TITLE_HEIGHT - paddingHorizontal);
        ctx.restore();
    }
    return r;
}

// Reference: https://github.com/ltdrdata/ComfyUI-Manager/blob/main/js/common.js
async function unloadModelsAndFreeMemory() {
    let res = await api.fetchApi(`/free`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: '{"unload_models": true, "free_memory": true}'
    });

    if (res.status === 200) {
        app.ui.dialog.show('<span style="color: green;">Unload models and free memory success.</span>')
    } else {
        app.ui.dialog.show('[ERROR] Unload models and free memory fail.')
    }
    app.ui.dialog.element.style.zIndex = 10010;
}

function setupClearExecutionCacheMenu() {
    const menu = document.querySelector(".comfy-menu");
    const freeButton = document.createElement("button");
    freeButton.textContent = "Clear Execution Cache";
    freeButton.onclick = async () => {
        await unloadModelsAndFreeMemory();
    };

    menu.append(freeButton);
}


let lastRunningDate = null;
let runningData = null;

function buildTableHtml() {
    const tableBody = $el("tbody")
    const table = $el("table", {
        textAlign: "right",
        border: "1px solid var(--border-color)",
        style: {"border-spacing": "0"}
    }, [
        $el("thead", [
            $el("tr", [
                $el("th", {"textContent": "Node Id"}),
                $el("th", {"textContent": "Node Title"}),
                $el("th", {"textContent": "Current Time"}),
                $el("th", {"textContent": "Per Time"}),
                $el("th", {"textContent": "Current / Pre Diff"})
            ])
        ]),
        tableBody
    ]);
    if (!runningData?.nodes_execution_time) {
        return table;
    }
    runningData.nodes_execution_time.forEach(function (item) {
        const nodeId = item.node;
        const node = app.graph.getNodeById(nodeId)
        const title = node?.title ?? nodeId
        const preExecutionTime = lastRunningDate?.nodes_execution_time?.find(x => x.node === nodeId)?.execution_time
        let diffText;
        let diffColor;
        if (preExecutionTime) {
            const diffTime = item.execution_time - preExecutionTime;
            const diffPercentText = `${(diffTime * 100 / preExecutionTime).toFixed(2)}%`;
            if (diffTime > 0) {
                diffColor = 'red';
                diffText = `+${formatExecutionTime(diffTime)} / +${diffPercentText}`;
            } else {
                diffColor = 'green';
                diffText = `${formatExecutionTime(diffTime)} / ${diffPercentText}`;
            }
        }
        tableBody.append($el("tr", {
            onclick: () => {
                if (node) {
                    app.canvas.selectNode(node, false);
                }
            }
        }, [
            $el("td", {style: {"textAlign": "right"}, "textContent": nodeId}),
            $el("td", {style: {"textAlign": "right"}, "textContent": title}),
            $el("td", {style: {"textAlign": "right"}, "textContent": formatExecutionTime(item.execution_time)}),
            $el("td", {
                style: {"textAlign": "right"},
                "textContent": preExecutionTime !== undefined ? formatExecutionTime(preExecutionTime) : undefined
            }),
            $el("td", {
                style: {
                    "textAlign": "right",
                    "color": diffColor
                },
                "textContent": diffText
            }),
        ]))
    });
    return table;
}

app.registerExtension({
    name: "TyDev-Utils.ExecutionTime",
    async setup() {
        setupClearExecutionCacheMenu();
        api.addEventListener("executing", ({detail}) => {
            const nodeId = detail;
            if (!nodeId) { // Finish
                stopRefreshTimer();
                lastRunningDate = runningData;
                return
            }
            const node = app.graph.getNodeById(nodeId)
            if (node) {
                node.ty_et_start_time = LiteGraph.getTime();
            }
        });

        api.addEventListener("TyDev-Utils.ExecutionTime.executed", ({detail}) => {
            const node = app.graph.getNodeById(detail.node)
            if (node) {
                node.ty_et_execution_time = detail.execution_time;
            }
            if (detail.prompt_id === runningData?.prompt_id) {
                const index = runningData.nodes_execution_time.findIndex(x => x.node === detail.node);
                const data = {
                    node: detail.node,
                    execution_time: detail.execution_time
                };
                if (index > 0) {
                    runningData.nodes_execution_time[index] = data
                } else {
                    runningData.nodes_execution_time.push(data)
                }
                app.graph._nodes.forEach(function (node) {
                    if (node.comfyClass === "TY_ExecutionTime" && node.widgets) {
                        const widget = node.widgets[0];
                        widget.inputEl.replaceChild(buildTableHtml(), widget.inputEl.firstChild);
                        const computeSize = node.computeSize();
                        const newSize = [Math.max(node.size[0], computeSize[0]), Math.max(node.size[1], computeSize[1])];
                        node.setSize(newSize);
                        app.graph.setDirtyCanvas(true);
                    }
                });
            }
        });

        api.addEventListener("execution_start", ({detail}) => {
            app.graph._nodes.forEach(function (node) {
                delete node.ty_et_start_time
                delete node.ty_et_execution_time
            });
            runningData = {
                prompt_id: detail.prompt_id,
                nodes_execution_time: []
            };
            startRefreshTimer();
        });
    },
    async nodeCreated(node, app) {
        if (!node.ty_et_swizzled) {
            let orig = node.onDrawForeground;
            if (!orig) {
                orig = node.__proto__.onDrawForeground;
            }

            node.onDrawForeground = function (ctx) {
                drawBadge(node, orig, arguments)
            };
            node.ty_et_swizzled = true;
        }
    },
    async loadedGraphNode(node, app) {
        if (!node.ty_et_swizzled) {
            const orig = node.onDrawForeground;
            node.onDrawForeground = function (ctx) {
                drawBadge(node, orig, arguments)
            };
            node.ty_et_swizzled = true;
        }
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === "TY_ExecutionTime") {
            const nodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                nodeCreated?.apply(this, arguments);

                const widget = {
                    type: "HTML",
                    name: "table",
                    draw: function (ctx, node, widgetWidth, y, widgetHeight) {
                        const margin = 0;
                        const elRect = ctx.canvas.getBoundingClientRect();
                        const transform = new DOMMatrix()
                            .scaleSelf(elRect.width / ctx.canvas.width, elRect.height / ctx.canvas.height)
                            .multiplySelf(ctx.getTransform())
                            .translateSelf(margin, margin + y);

                        const x = Math.max(0, Math.round(ctx.getTransform().a * (node.size[0] - this.inputEl.scrollWidth - 2 * margin) / 2));
                        Object.assign(
                            this.inputEl.style,
                            {
                                transformOrigin: '0 0',
                                transform: transform,
                                left: `${x}px`,
                                top: `0px`,
                                position: "absolute",
                                maxWidth: `${widgetWidth - margin * 2}px`,
                                maxHeight: `${node.size[1] - margin * 2 - y}px`,
                                width: `auto`,
                                height: `auto`,
                                overflow: `auto`,
                            }
                        );
                    },
                };
                widget.inputEl = $el("div");

                document.body.appendChild(widget.inputEl);

                this.addCustomWidget(widget);
                this.onRemoved = function () {
                    widget.inputEl.remove();
                };
                this.serialize_widgets = false;

                const tableElem = buildTableHtml();

                widget.inputEl.appendChild(tableElem)

                const computeSize = nodeType.prototype.computeSize || LGraphNode.prototype.computeSize;
                nodeType.prototype.computeSize = function () {
                    const originSize = computeSize.apply(this, arguments);
                    if (this.flags?.collapsed || !this.widgets) {
                        return originSize;
                    }
                    const paddingBottom = 60;
                    const widget = this.widgets[0];
                    const tableElem = widget.inputEl.firstChild;
                    const tableBoundingClientRect = tableElem.getBoundingClientRect();
                    const tableSize = [Math.round(tableBoundingClientRect.width), Math.round(tableBoundingClientRect.height)];
                    return [Math.max(tableSize[0], originSize[0]), Math.max(tableSize[1] + paddingBottom, originSize[1])];
                }
                this.setSize(this.computeSize());
            }
        }
    }
});