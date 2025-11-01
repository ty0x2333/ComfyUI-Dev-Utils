0.6.2
---

### BUG Fix

1. Fixed ExecutionTime throwing an error during execution after the latest ComfyUI [513b0c46](https://github.com/comfyanonymous/ComfyUI/commit/513b0c46fba3bf40191d684ff81207ad935f1717) update.

0.6.1
---

### Enhancement

1. Rename hook methods starting with `swizzle_` to `dev_utils_`, so that errors can be located more easily.

### BUG Fix

1. Fix TypeError: swizzle_execute() missing 1 required positional argument: 'pending_async_nodes'.

   https://github.com/ty0x2333/ComfyUI-Dev-Utils/issues/33

0.6.0
---

### BUG Fix

1. Fix for new async support added in ComfyUI PR #8830

   https://github.com/ty0x2333/ComfyUI-Dev-Utils/pull/32

   Thanks [Geeknasty](https://github.com/Geeknasty)

0.5.1
---

### BUG Fix

1. `getSlotMenuOptions.apply` incorrectly applying arguments when right clicking on slots.

   https://github.com/ty0x2333/ComfyUI-Dev-Utils/issues/18

   Thanks [Trung0246](https://github.com/Trung0246)

0.5.0
---

### Enhancement

1. Add VRAM Used to the ExecutionTime Node.

   PR: https://github.com/ty0x2333/ComfyUI-Dev-Utils/pull/20

   Thanks [drake7707](https://github.com/drake7707) .

2. Add a Max statistics row to the ExecutionTime Node to easily view the longest execution time of a node and the VRAM
   requirements of the workflow.

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
