ComfyUI-Dev-Utils
===
[![GitHub Tag](https://img.shields.io/github/v/tag/ty0x2333/ComfyUI-Dev-Utils)](https://github.com/ty0x2333/ComfyUI-Dev-Utils/tags)

Installation
---

#### ComfyUI-Manager

Guide: [ComfyUI-Manager How-to-use](https://github.com/ltdrdata/ComfyUI-Manager#how-to-use)

#### Manual

In your ComfyUI directory:

```shell
$ cd custom_nodes
$ git clone https://github.com/ty0x2333/ComfyUI-Dev-Utils.git
$ cd ComfyUI-Dev-Utils
$ pip install requirements.txt
```

**Finally, restart ComfyUI**

Features
---

1. Execution Time Analysis Tool
    - When running, a Badge will be added to the upper left corner of the Node to display the execution time of the
      node.
      <details open>
      <summary>Preview</summary>
      <img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/execution-time-badge.png" style="height: 150px">
      </details>
    - Add `Execution Time` Node to display the execution time of each node in a table. At the same time, the current
      execution time and the last execution time, as well as their differences, will be displayed.
      <details open>
      <summary>Preview</summary>

      <img height="150" alt="execution-time-node" src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/assets/7489176/5301f97d-0b38-4a21-859a-12ef06fb0b43">

      </details>
    - Add a "Clear Execution Cache" button to the sidebar menu. Click it to clear the current cache(unload models and
      free memory).
      <details open>
      <summary>Preview</summary>
      <img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/clear-execution-cache-button.png" style="height:200px">
      </details>
   
   <details open>
   <summary>Usage Example (Video)</summary>

    [Execution Time Analysis Demo](https://github.com/ty0x2333/ComfyUI-Dev-Utils/assets/7489176/1345f5db-c7b8-482c-9b71-de2da4d9ca09)

   </details>

2. Log Console

   Provide a Console panel to display **Python logs** (**not** Javascript console.log).

   `LogConsole` automatically captures the output of `print`, `logging`, `stdout` and `stderr`. Then send it to the web page via SSE.

   <img width="600" alt="2024-04-28 07 42 37" src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/assets/7489176/08a4da36-8cf7-4ff9-8fc1-1e1f955cd317">


   `LogConsole` Feautes:

   - **based on SSE, not Websocket. It will not affect the performance of ComfyUI's core and other functions.**
   - Support text color. Differentiate error logs by color.
   - Lazy startup, only starts capturing logs when needed.
   - Supports completely disabling LogConsole.

   <br/>
   <details open>
   <summary>Usage Example (Video)</summary>

    [LogConsole Demo](https://github.com/ty0x2333/ComfyUI-Dev-Utils/assets/7489176/f8295843-80ae-43e5-9702-3fd6c1962519)

   </details>

4. Reroute Enhancement
    - Add "Reroute" option to node slot menu.

      <details open>
      <summary>Preview</summary>
      <table class="center">
        <tr style="line-height: 0">
        <td width=50% style="border: none; text-align: center">Before</td>
        <td width=50% style="border: none; text-align: center">After</td>
        </tr>
        <tr>
        <td width=50% style="border: none"><img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/before-reroute.gif" style="width:100%"></td>
        <td width=50% style="border: none"><img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/after-reroute.gif" style="width:100%"></td>
        </tr>
      </table>
      </details>

    - Optimized for deleting Reroute Node.

      <details open>
      <summary>Preview</summary>
      <table class="center">
        <tr style="line-height: 0">
        <td width=50% style="border: none; text-align: center">Before</td>
        <td width=50% style="border: none; text-align: center">After</td>
        </tr>
        <tr>
        <td width=50% style="border: none"><img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/before-delete-reroute-node.gif" style="width:100%"></td>
        <td width=50% style="border: none"><img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/after-delete-reroute-node.gif" style="width:100%"></td>
        </tr>
      </table>
      </details>

5. `UrlDownload` Node

   Download file from remote url and get file path

6. `UploadAnything` Node

   Upload any file and get file path

Reference
---

- [ltdrdata/ComfyUI-Manager](https://github.com/ltdrdata/ComfyUI-Manager)
- [Kosinkadink/ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)
- [chrisgoringe/cg-quicknodes](https://github.com/chrisgoringe/cg-quicknodes)
- [tzwm/comfyui-profiler](https://github.com/tzwm/comfyui-profiler)
- [xtermjs/xterm.js](https://github.com/xtermjs/xterm.js)

License
---
ComfyUI-Dev-Utils is available under the MIT license. See the LICENSE file for more info.
