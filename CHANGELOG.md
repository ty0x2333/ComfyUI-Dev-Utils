0.4.3
---

### BUG Fix

1. Fix BUG: The ExecutionTime Node is not working with the latest version of ComfyUI.
   PR: https://github.com/ty0x2333/ComfyUI-Dev-Utils/pull/16

   Thanks [hugovntr](https://github.com/hugovntr) .

   ComfyUI commit: https://github.com/comfyanonymous/ComfyUI/tree/5cfe38f41c7091b0fd954877d9d7427a8b438b1a

0.4.2
---

### Enhancement

1. Ignore the ExecutionTime Node when saving the API.

0.4.1
---

### New Feature

1. Support [Comfy-Org/comfy-cli](https://github.com/Comfy-Org/comfy-cli)

0.4.0
---

### Enhancement

1. Save LogConsole panel "Collapsed" state

### BUG Fix

1. Remove "prompt_id" judgment from ExecutionTime. (Compatible with `ComfyUI-Workflow-Component`)

   > ComfyUI-Workflow-Component will repeatedly call "execution_start"
   with different "prompt_id" in the component.

0.3.0
---

### New Feature

1. Add Log Console

   <img width="600" alt="2024-04-28 07 42 37" src="https://github.com/ty0x2333/ComfyUI-Dev-Utils/assets/7489176/5b44f45c-9fda-4478-a047-b61576ec03dd">

0.2.0
---

### New Feature

1. Support export Execution Time CSV File.

### Enhancement

1. Optimize the style of Execution Time Node to make it better Resize.
2. Support Execution Time Node auto-resize
