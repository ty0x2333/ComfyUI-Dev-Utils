import {app} from "../../../scripts/app.js";
import {api} from "../../../scripts/api.js";
import {$el} from "../../../scripts/ui.js";

function addScript(src) {
    $el("script", {
        parent: document.head,
        src: src
    });
}

function addCss(src) {
    $el("link", {
        parent: document.head,
        rel: "stylesheet",
        type: "text/css",
        href: src
    });
}

const getValue = (key, defaultValue) => {
    const storageKey = localStorage.getItem("TyDev-Utils.LogConsole." + key);
    if (storageKey && !isNaN(+storageKey)) {
        return storageKey;
    }
    return defaultValue;
};

const setValue = (key, value) => {
    localStorage.setItem("TyDev-Utils.LogConsole." + key, value);
};

let logConsoleEnabled = true;


// https://stackoverflow.com/a/8809472
function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

let consoleId = generateUUID()

app.registerExtension({
    name: "TyDev-Utils.LogConsole",
    eventSource: null,
    terminal: null,

    async setup() {
        const showButton = $el("button.comfy-settings-btn", {
            style: {
                right: "16px",
                cursor: "pointer"
            },
        }, [
            $el("img", {
                src: new URL("images/terminal@2x.png", import.meta.url).toString(),
                style: {
                    marginTop: "2px",
                    width: "14px",
                    height: "14px"
                }
            })
        ]);

        document.querySelector(".comfy-settings-btn").after(showButton);

        addScript(new URL("vendor/xterm.min.js", import.meta.url).toString());
        addCss(new URL("vendor/xterm.min.css", import.meta.url).toString());
        addScript(new URL("vendor/xterm-addon-fit.min.js", import.meta.url).toString());
        addScript(new URL("vendor/interact.min.js", import.meta.url).toString());

        addCss(new URL("logConsole.css", import.meta.url).toString());

        const consoleElem = $el('div');
        consoleElem.id = 'tydev-utils-log-console';

        const collapseButton = $el("button.expand-button", [
            $el("div.arrow.arrow-down", [$el("i.arrow-icon")])
        ]);
        const closeButton = $el("button.comfy-close-menu-btn", {textContent: 'x'});
        const clearButton = $el("button", {
            textContent: '🗑️',
            style: {
                fontSize: '14px'
            },
            onclick: () => {
                this.terminal?.clear();
            }
        });
        const consoleMenuContainer = $el("div.tydev-utils-log-console-menu-container", [
            clearButton,
            closeButton
        ])
        const stateElem = $el("strong");
        stateElem.id = "tydev-utils-log-console-state";
        const consoleIdElem = $el("div", {
            textContent: `ID: ${consoleId}`,
            style: {
                fontSize: '12px',
                marginLeft: '8px',
                lineHeight: '20px',
                color: 'var(--descrip-text)'
            }
        });
        const consoleStateElem = $el("div", {style: {display: 'flex', flexDirection: 'row'}}, [
            stateElem,
            consoleIdElem
        ]);
        const headerElem = $el("div.tydev-utils-log-console-control", [
            consoleStateElem,
            collapseButton,
            consoleMenuContainer
        ]);
        const containerElem = $el("div.tydev-utils-log-console-container", [
            headerElem,
            consoleElem
        ]);
        document.body.append(containerElem);

        const defaultHeight = 240;
        const controlHeight = 20;

        const setPanelCollapsed = (collapsed) => {
            if (collapsed) {
                collapseButton.firstChild.className = "arrow arrow-up"
            } else {
                collapseButton.firstChild.className = "arrow arrow-down"
            }
            containerElem.style.height = `${collapsed ? controlHeight : defaultHeight}px`
            containerElem.setAttribute('data-y', collapsed ? defaultHeight - controlHeight : 0);
            setValue("Collapsed", collapsed ? '1' : '0')
        };

        collapseButton.onclick = () => {
            const toCollapsed = !collapseButton.firstChild.className.includes("arrow-up");
            setPanelCollapsed(toCollapsed);
        };

        interact(containerElem)
            .resizable({
                // resize from all edges and corners
                edges: {left: false, right: false, bottom: false, top: true},

                listeners: {
                    move(event) {
                        var target = event.target
                        // var x = (parseFloat(target.getAttribute('data-x')) || 0)
                        var y = parseFloat(target.getAttribute('data-y')) || 0

                        // update the element's style
                        // target.style.width = event.rect.width + 'px'
                        target.style.height = event.rect.height + 'px'

                        // translate when resizing from top or left edges
                        // x += event.deltaRect.left
                        y += event.deltaRect.top

                        // target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

                        // target.setAttribute('data-x', x)
                        target.setAttribute('data-y', y)
                        event.preventDefault();
                        // target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)
                    }
                },
                modifiers: [
                    // keep the edges inside the parent
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    }),

                    // minimum size
                    interact.modifiers.restrictSize({
                        min: {height: controlHeight}
                    })
                ],

                inertia: true
            })

        const collapsed = getValue('Collapsed', '0') === '1';
        setPanelCollapsed(collapsed);

        const setConsoleVisible = (visible) => {
            setValue('Visible', visible ? '1' : '0');
            containerElem.hidden = !visible || !logConsoleEnabled;
            showButton.hidden = visible || !logConsoleEnabled;
        }

        // Initialize the console visibility based on saved state (default to hidden)
        const initiallyVisible = getValue('Visible', '0') === '1';
        setConsoleVisible(initiallyVisible);

        this.setupTerminal(containerElem, consoleElem);

        // Don't start SSE connection by default since console is disabled by default
        // SSE will start when console is enabled via the toggle

        showButton.onclick = () => {
            const newVisible = !(getValue('Visible', '0') === '1');
            setConsoleVisible(newVisible);
            // Manage SSE connection based on visibility
            if (newVisible && logConsoleEnabled) {
                this.startSSE();
            }
        }
        closeButton.onclick = () => {
            setConsoleVisible(false);
            // Note: Keep SSE running when manually closed, so logs are ready when reopened
            // SSE is only stopped when the main toggle is turned off
        }

        api.addEventListener("reconnected", () => {
            if (this.eventSource) {
                this.startSSE();
            }
        });

        const onEnabledChange = (value) => {
            logConsoleEnabled = value;
            if (value) {
                this.startSSE();
                // When enabling, show the console window
                setConsoleVisible(true);
            } else {
                this.stopSSE();
                // When disabling, hide the console window
                setConsoleVisible(false);
            }

            if (!value) {
                api.fetchApi(`/ty-dev-utils/disable-log?console_id=${consoleId}&client_id=${api.clientId}`, {
                    method: "POST"
                });
            }
        }

        logConsoleEnabled = app.ui.settings.addSetting({
            id: "TyDev-Utils.LogConsole.Enabled",
            name: "TyDev LogConsole Enabled",
            type: "boolean",
            defaultValue: false,
            onChange: onEnabledChange
        });

        // Execution time logging toggle
        let executionTimeLoggingEnabled = false;
        const onExecutionTimeLogChange = (value) => {
            executionTimeLoggingEnabled = value;
            // Send API request to backend to toggle execution time logging
            api.fetchApi("/ty-dev-utils/toggle-execution-logging", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: value })
            }).catch(err => console.error("Failed to toggle execution time logging:", err));
        };
        executionTimeLoggingEnabled = app.ui.settings.addSetting({
            id: "TyDev-Utils.LogConsole.ExecutionTimeLoggingEnabled", 
            name: "TyDev LogConsole Execution Time Logging Enabled",
            type: "boolean",
            defaultValue: false,
            onChange: onExecutionTimeLogChange
        });
    },
    setupTerminal(containerElem, consoleElem) {
        if (this.terminal) {
            return;
        }
        this.terminal = new Terminal({
            convertEol: true,
        });
        const terminal = this.terminal;
        this.terminal.attachCustomKeyEventHandler((e) => {
            if (e.ctrlKey && e.keyCode === 76) {
                // Ctrl + L
                terminal.clear();
                return false;
            }
        });
        const fitAddon = new FitAddon.FitAddon();
        this.terminal.loadAddon(fitAddon);
        this.terminal.open(consoleElem);
        fitAddon.fit();

        const resizeObserver = new ResizeObserver(function (entries) {
            try {
                fitAddon && fitAddon.fit();
            } catch (err) {
                console.log(err);
            }
        });

        resizeObserver.observe(containerElem);
    },
    startSSE() {
        if ([EventSource.OPEN, EventSource.CONNECTING].includes(this.eventSource?.readyState)) {
            return
        }
        const logSSEUrl = api.apiURL(`/ty-dev-utils/log?console_id=${consoleId}&client_id=${api.clientId}`);
        this.eventSource = new EventSource(logSSEUrl);
        this.eventSource.onopen = () => {
            this.setSSEState(this.eventSource.readyState);
        };

        this.eventSource.onerror = (error) => {
            this.eventSource.close();
            this.setSSEState(this.eventSource.readyState);
        };

        const messageHandler = (event) => {
            this.terminal?.write(event.data);
        }

        this.eventSource.addEventListener("message", messageHandler);
    },
    stopSSE() {
        this.eventSource?.close();
        this.setSSEState(EventSource.CLOSED);
        this.eventSource = null;
    },
    setSSEState(state) {
        const stateElem = document.getElementById("tydev-utils-log-console-state");
        if (stateElem) {
            let stateTextColor;
            let stateText;
            if (state === EventSource.OPEN) {
                stateTextColor = "green";
                stateText = "CONNECTED";
            } else if (state === EventSource.CONNECTING) {
                stateTextColor = "gold";
                stateText = "CONNECTING";
            } else if (state === EventSource.CLOSED) {
                stateTextColor = 'red';
                stateText = "CLOSED";
            }
            stateElem.style.color = stateTextColor;
            stateElem.innerText = stateText;
        }
    }
});
