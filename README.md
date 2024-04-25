ComfyUI-Dev-Utils
===

Installation
---

#### ComfyUI-Manager

Guide: [ComfyUI-Manager How-to-use](https://github.com/ltdrdata/ComfyUI-Manager#how-to-use)

#### Manual

In your ComfyUI directory:

```shell
$ cd custom_nodes
$ git clone https://github.com/ty0x2333/ComfyUI-Dev-Utils.git
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
      <img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/execution-time-node.png" style="height: 150px">
      </details>
    - Add a "Clear Execution Cache" button to the sidebar menu. Click it to clear the current cache(unload models and
      free memory).
      <details open>
      <summary>Preview</summary>
      <img src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/wiki/images/clear-execution-cache-button.png" style="height:200px">
      </details>
   
   <details open>
   <summary>Usage Example (Video)</summary>

   [Execution Time Analysis Demo](https://github.com/ty0x2333/ComfyUI-Dev-Utils/assets/7489176/6a7a2a36-85cf-4cff-b916-796ea2e43d5f)

   </details>

3. Reroute Enhancement
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

4. `UrlDownload` Node

   Download file from remote url and get file path

5. `UploadAnything` Node

   Upload any file and get file path

Reference
---

- [ltdrdata/ComfyUI-Manager](https://github.com/ltdrdata/ComfyUI-Manager)
- [Kosinkadink/ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)
- [chrisgoringe/cg-quicknodes](https://github.com/chrisgoringe/cg-quicknodes)
- [tzwm/comfyui-profiler](https://github.com/tzwm/comfyui-profiler)

License
---
ComfyUI-Dev-Utils is available under the MIT license. See the LICENSE file for more info.
