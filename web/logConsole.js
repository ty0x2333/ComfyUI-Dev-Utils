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

        const expandButton = $el("button.expand-button", [
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
        const consoleStateElem = $el("div");
        consoleStateElem.id = "tydev-utils-log-console-state";
        const controlElem = $el("div.tydev-utils-log-console-control", [
            consoleStateElem,
            expandButton,
            consoleMenuContainer
        ]);
        const containerElem = $el("div.tydev-utils-log-console-container", [
            controlElem,
            consoleElem
        ]);
        document.body.append(containerElem);

        const defaultHeight = 240;
        const controlHeight = 20;

        expandButton.onclick = () => {
            const open = !expandButton.firstChild.className.includes("arrow-down");
            if (open) {
                expandButton.firstChild.className = "arrow arrow-down"
            } else {
                expandButton.firstChild.className = "arrow arrow-up"
            }
            containerElem.style.height = `${open ? defaultHeight : controlHeight}px`
            containerElem.setAttribute('data-y', open ? 0 : defaultHeight - controlHeight);
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

        this.setupTerminal(containerElem, consoleElem);

        const setConsoleVisible = (visible) => {
            setValue('Visible', visible ? '1' : '0');
            containerElem.hidden = !visible;
            showButton.hidden = visible;
        }

        const visible = getValue('Visible', '1') === '1';
        setConsoleVisible(visible);

        showButton.onclick = () => {
            setConsoleVisible(!(getValue('Visible', '1') === '1'));
        }
        closeButton.onclick = () => {
            setConsoleVisible(false);
        }

        this.startSSE();

        api.addEventListener("reconnected", () => {
            if (this.eventSource) {
                this.startSSE();
            }
        });
    },
    setupTerminal(containerElem, consoleElem) {
        if (this.terminal) {
            return;
        }
        this.terminal = new Terminal({
            convertEol: true,
        });
        const fitAddon = new FitAddon.FitAddon();
        this.terminal.loadAddon(fitAddon);
        this.terminal.open(consoleElem);
        fitAddon.fit();

        const resizeObserver = new ResizeObserver(function (entries) {
            // since we are observing only a single element, so we access the first element in entries array
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
        const logSSEUrl = api.apiURL(`/ty-dev-utils/log?client_id=${api.clientId}`);
        this.eventSource = new EventSource(logSSEUrl);
        this.eventSource.onopen = () => {
            // console.log('EventSource connected')
            this.setSSEState(this.eventSource.readyState);
        };

        this.eventSource.onerror = (error) => {
            // console.error('EventSource failed', error)
            this.eventSource.close()
            this.setSSEState(this.eventSource.readyState);
        };

        const messageHandler = (event) => {
            this.terminal?.write(event.data)
            // console.log(event.data);
        }

        this.eventSource.addEventListener("message", messageHandler);
    },
    setSSEState(state) {
        let innerHTML
        if (state === EventSource.OPEN) {
            innerHTML = "<strong style='color: green'>CONNECTED</strong>";
        } else if (state === EventSource.CONNECTING) {
            innerHTML = "<strong style='color: gold'>CONNECTED</strong>";
        } else if (state === EventSource.CLOSED) {
            innerHTML = "<strong style='color: red'>CLOSED</strong>";
        }
        const elem = document.getElementById("tydev-utils-log-console-state");
        if (!elem) {
            return;
        }
        elem.innerHTML = innerHTML;
    }
});
