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

app.registerExtension({
    name: "TyDev-Utils.LogConsole",
    async setup() {

        addScript(new URL("vendor/xterm.min.js", import.meta.url).toString());
        addCss(new URL("vendor/xterm.min.css", import.meta.url).toString());
        addScript(new URL("vendor/xterm-addon-fit.min.js", import.meta.url).toString());
        addScript(new URL("vendor/interact.min.js", import.meta.url).toString());

        addCss(new URL("logConsole.css", import.meta.url).toString());

        const consoleElem = $el('div');
        consoleElem.id = 'tydev-utils-log-console';
        const containerElem = $el("div.tydev-utils-log-console-container", [
            $el('div.tydev-utils-log-console-control', [
                $el("span.drag-handle")
            ]),
            consoleElem
        ]);
        document.body.append(containerElem);

        const controlHeight = 20;

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

        var terminal = new Terminal({
            convertEol: true,
        });
        var fitAddon = new FitAddon.FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(consoleElem);
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

        const url = api.apiURL(`/ty-dev-utils/log?client_id=${api.clientId}`);
        const eventSource = new EventSource(url);
        // TODO: TEST
        eventSource.onopen = () => {
            console.log('EventSource connected')
        };

        // TODO: TEST
        eventSource.onerror = (error) => {
            console.error('EventSource failed', error)
            eventSource.close()
        };

        eventSource.addEventListener("message", function (event) {
            terminal.write(event.data)
            console.log(event.data);
        });
    }
});
