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


// https://stackoverflow.com/a/56370447
function exportTable(table, separator = ',') {
    // Select rows from table_id
    var rows = table.querySelectorAll('tr');
    // Construct csv
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            // Clean innertext to remove multiple spaces and jumpline (break csv)
            var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
            // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
            data = data.replace(/"/g, '""');
            // Push escaped string
            row.push('"' + data + '"');
        }
        csv.push(row.join(separator));
    }
    var csv_string = csv.join('\n');
    // Download it
    var filename = 'execution_time' + new Date().toLocaleDateString() + '.csv';
    var link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function buildTableHtml() {
    const tableBody = $el("tbody")
    const tableFooter = $el("tfoot", {style: {"background": "var(--comfy-input-bg)"}})
    const table = $el("table", {
        textAlign: "right",
        border: "1px solid var(--border-color)",
        style: {"border-spacing": "0", "font-size": "14px"}
    }, [
        $el("thead", {style: {"background": "var(--comfy-input-bg)"}}, [
            $el("tr", [
                $el("th", {"textContent": "Node Id"}),
                $el("th", {"textContent": "Node Title"}),
                $el("th", {"textContent": "Current Time"}),
                $el("th", {"textContent": "Per Time"}),
                $el("th", {"textContent": "Current / Pre Diff"})
            ])
        ]),
        tableBody,
        tableFooter
    ]);
    if (!runningData?.nodes_execution_time) {
        return table;
    }

    function diff(current, pre) {
        let diffText;
        let diffColor;
        if (pre) {
            const diffTime = current - pre;
            const diffPercentText = `${(diffTime * 100 / pre).toFixed(2)}%`;
            if (diffTime > 0) {
                diffColor = 'red';
                diffText = `+${formatExecutionTime(diffTime)} / +${diffPercentText}`;
            } else if (diffPercentText === '0.00%') {
                diffColor = 'white';
                diffText = formatExecutionTime(diffTime);
            } else {
                diffColor = 'green';
                diffText = `${formatExecutionTime(diffTime)} / ${diffPercentText}`;
            }
        }
        return [diffColor, diffText]
    }

    runningData.nodes_execution_time.forEach(function (item) {
        const nodeId = item.node;
        const node = app.graph.getNodeById(nodeId)
        const title = node?.title ?? nodeId
        const preExecutionTime = lastRunningDate?.nodes_execution_time?.find(x => x.node === nodeId)?.execution_time

        const [diffColor, diffText] = diff(item.execution_time, preExecutionTime);

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
    if (runningData.total_execution_time !== null) {
        const [diffColor, diffText] = diff(runningData.total_execution_time, lastRunningDate?.total_execution_time);
        tableFooter.append($el("tr", [
            $el("td", {style: {"textAlign": "right"}, "textContent": 'Total'}),
            $el("td", {style: {"textAlign": "right"}, "textContent": ''}),
            $el("td", {
                style: {"textAlign": "right"},
                "textContent": formatExecutionTime(runningData.total_execution_time)
            }),
            $el("td", {
                style: {"textAlign": "right"},
                "textContent": lastRunningDate?.total_execution_time ? formatExecutionTime(lastRunningDate?.total_execution_time) : undefined
            }),
            $el("td", {
                style: {
                    "textAlign": "right",
                    "color": diffColor
                },
                "textContent": diffText
            }),
        ]))
    }
    return table;
}

function refreshTable() {
    app.graph._nodes.forEach(function (node) {
        if (node.comfyClass === "TY_ExecutionTime" && node.widgets) {
            const tableWidget = node.widgets.find((w) => w.name === "Table");
            if (!tableWidget) {
                return;
            }
            tableWidget.inputEl.replaceChild(buildTableHtml(), tableWidget.inputEl.firstChild);
            const computeSize = node.computeSize();
            const newSize = [Math.max(node.size[0], computeSize[0]), Math.max(node.size[1], computeSize[1])];
            node.setSize(newSize);
            app.graph.setDirtyCanvas(true);
        }
    });
}

app.registerExtension({
    name: "TyDev-Utils.ExecutionTime",
    async setup() {
        setupClearExecutionCacheMenu();
        api.addEventListener("executing", ({detail}) => {
            const nodeId = detail;
            if (!nodeId) { // Finish
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
                refreshTable();
            }
        });

        api.addEventListener("execution_start", ({detail}) => {
            lastRunningDate = runningData;
            app.graph._nodes.forEach(function (node) {
                delete node.ty_et_start_time
                delete node.ty_et_execution_time
            });
            runningData = {
                prompt_id: detail.prompt_id,
                nodes_execution_time: [],
                total_execution_time: null
            };
            startRefreshTimer();
        });

        api.addEventListener("TyDev-Utils.ExecutionTime.execution_end", ({detail}) => {
            stopRefreshTimer();
            runningData.total_execution_time = detail.execution_time;
            refreshTable();
        })
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

                const tableWidget = {
                    type: "HTML",
                    name: "Table",
                    draw: function (ctx, node, widgetWidth, y, widgetHeight) {
                        const marginHorizontal = 14;
                        const marginTop = 0;
                        const marginBottom = 14;
                        const elRect = ctx.canvas.getBoundingClientRect();
                        const transform = new DOMMatrix()
                            .scaleSelf(elRect.width / ctx.canvas.width, elRect.height / ctx.canvas.height)
                            .multiplySelf(ctx.getTransform())
                            .translateSelf(marginHorizontal, marginTop + y);

                        const x = Math.max(0, Math.round(ctx.getTransform().a * (node.size[0] - this.inputEl.scrollWidth - 2 * marginHorizontal) / 2));
                        Object.assign(
                            this.inputEl.style,
                            {
                                transformOrigin: '0 0',
                                transform: transform,
                                left: `${x}px`,
                                top: `0px`,
                                position: "absolute",
                                maxWidth: `${widgetWidth - marginHorizontal * 2}px`,
                                maxHeight: `${node.size[1] - (marginTop + marginBottom) - y}px`,
                                width: `auto`,
                                height: `auto`,
                                overflow: `auto`,
                            }
                        );
                    },
                };
                tableWidget.inputEl = $el("div");

                document.body.appendChild(tableWidget.inputEl);

                this.addWidget("button", "Export CSV", "display: none", () => {
                    exportTable(tableWidget.inputEl.firstChild)
                });
                this.addCustomWidget(tableWidget);

                this.onRemoved = function () {
                    tableWidget.inputEl.remove();
                };
                this.serialize_widgets = false;

                const tableElem = buildTableHtml();

                tableWidget.inputEl.appendChild(tableElem)

                const computeSize = nodeType.prototype.computeSize || LGraphNode.prototype.computeSize;
                nodeType.prototype.computeSize = function () {
                    const originSize = computeSize.apply(this, arguments);
                    if (this.flags?.collapsed || !this.widgets) {
                        return originSize;
                    }
                    const tableWidget = this.widgets.find((w) => w.name === "Table");
                    if (!tableWidget) {
                        return originSize;
                    }
                    const tableElem = tableWidget.inputEl.firstChild;
                    const tableBoundingClientRect = tableElem.getBoundingClientRect();
                    const tableSize = [Math.round(tableBoundingClientRect.width), Math.round(tableBoundingClientRect.height)];
                    return [Math.max(tableSize[0], originSize[0]), tableSize[1] + originSize[1]];
                }
                this.setSize(this.computeSize());
            }
        }
    }
});