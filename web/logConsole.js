import {app} from "../../../scripts/app.js";
import {api} from "../../../scripts/api.js";

app.registerExtension({
    name: "TyDev-Utils.LogConsole",
    async setup() {
        const url = api.apiURL(`/ty-dev-utils/log?client_id=${api.clientId}`);
        const eventSource = new EventSource(url);
        // TODO: TEST
        eventSource.onopen = () => {
            console.log('EventSource connected')
        }

        // TODO: TEST
        eventSource.onerror = (error) => {
            console.error('EventSource failed', error)
            eventSource.close()
        }

        eventSource.addEventListener("message", function (event) {
            console.log(event.data);
        });
    }
});
