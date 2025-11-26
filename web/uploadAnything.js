import {app} from "../../../scripts/app.js";
import {api} from '../../../scripts/api.js'

async function uploadFile(file) {
    try {
        const body = new FormData();
        const i = file.webkitRelativePath.lastIndexOf('/');
        const subfolder = file.webkitRelativePath.slice(0, i + 1)
        const new_file = new File([file], file.name, {
            type: file.type,
            lastModified: file.lastModified,
        });
        body.append("image", new_file);
        if (i > 0) {
            body.append("subfolder", subfolder);
        }
        const resp = await api.fetchApi("/upload/image", {
            method: "POST",
            body,
        });

        if (resp.status === 200) {
            return resp.status
        } else {
            alert(resp.status + " - " + resp.statusText);
        }
    } catch (error) {
        alert(error);
    }
}

function addUploadWidget(nodeType, nodeData, widgetName) {
    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
        const pathWidget = this.widgets.find((w) => w.name === widgetName);
        const fileInput = document.createElement("input");
        const onRemoved = this.onRemoved;
        this.onRemoved = () => {
            fileInput?.remove();
            onRemoved?.apply(this, arguments);
        }
        Object.assign(fileInput, {
            type: "file",
            accept: "*",
            style: "display: none",
            onchange: async () => {
                if (fileInput.files.length) {
                    if (await uploadFile(fileInput.files[0]) != 200) {
                        //upload failed and file can not be added to options
                        return;
                    }
                    const filename = fileInput.files[0].name;
                    pathWidget.options.values.push(filename);
                    pathWidget.value = filename;
                    if (pathWidget.callback) {
                        pathWidget.callback(filename)
                    }
                    app.graph.setDirtyCanvas(true);
                }
            },
        });
        document.body.append(fileInput);
        let uploadWidget = this.addWidget("button", "choose file to upload", "image", () => {
            //clear the active click event
            app.canvas.node_widget = null

            fileInput.click();
        });
        uploadWidget.options.serialize = false;

        onNodeCreated?.apply(this, arguments);
    }
}

app.registerExtension({
    name: "TyDev-Utils.UploadAnything",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData?.name === 'TY_UploadAnything') {
            addUploadWidget(nodeType, nodeData, 'file')
        }
    },
});
