import time

import execution
import server
import model_management

class ExecutionTime:
    CATEGORY = "TyDev-Utils/Debug"

    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "process"

    def process(self):
        return ()


CURRENT_START_EXECUTION_DATA = None


def handle_execute(class_type, last_node_id, prompt_id, server, unique_id):
    if not CURRENT_START_EXECUTION_DATA:
        return
    start_time = CURRENT_START_EXECUTION_DATA['nodes_start_perf_time'].get(unique_id)
    start_vram = CURRENT_START_EXECUTION_DATA['nodes_start_vram_time'].get(unique_id)
    if start_time:
        end_time = time.perf_counter()
        end_vram = model_management.get_free_memory()
        execution_time = end_time - start_time
        # use abs because it can be negative, that means the model_manager already loaded the model when we started profiling and cleared the model at the end
        # it's not super accurate for anything small but for large models it's really handy to know what the footprint is
        vram_used = abs(end_vram - start_vram)
        if server.client_id is not None and last_node_id != server.last_node_id:
            server.send_sync(
                "TyDev-Utils.ExecutionTime.executed",
                {"node": unique_id, "prompt_id": prompt_id, "execution_time": int(execution_time * 1000), "vram_used": vram_used  },
                server.client_id
            )
        print(f"#{unique_id} [{class_type}]: {execution_time:.2f}s - vram {vram_used}b")


try:
    origin_execute = execution.execute


    def swizzle_execute(server, dynprompt, caches, current_item, extra_data, executed, prompt_id, execution_list,
                        pending_subgraph_results):
        unique_id = current_item
        class_type = dynprompt.get_node(unique_id)['class_type']
        last_node_id = server.last_node_id
        result = origin_execute(server, dynprompt, caches, current_item, extra_data, executed, prompt_id,
                                execution_list,
                                pending_subgraph_results)
        handle_execute(class_type, last_node_id, prompt_id, server, unique_id)
        return result


    execution.execute = swizzle_execute
except Exception as e:
    pass

# region: Deprecated
try:
    # The execute method in the old version of ComfyUI is now deprecated.
    origin_recursive_execute = execution.recursive_execute


    def swizzle_origin_recursive_execute(server, prompt, outputs, current_item, extra_data, executed, prompt_id,
                                         outputs_ui,
                                         object_storage):
        unique_id = current_item
        class_type = prompt[unique_id]['class_type']
        last_node_id = server.last_node_id
        result = origin_recursive_execute(server, prompt, outputs, current_item, extra_data, executed, prompt_id,
                                          outputs_ui,
                                          object_storage)
        handle_execute(class_type, last_node_id, prompt_id, server, unique_id)
        return result


    execution.recursive_execute = swizzle_origin_recursive_execute
except Exception as e:
    pass
# endregion

origin_func = server.PromptServer.send_sync


def swizzle_send_sync(self, event, data, sid=None):
    # print(f"swizzle_send_sync, event: {event}, data: {data}")
    global CURRENT_START_EXECUTION_DATA
    if event == "execution_start":
        CURRENT_START_EXECUTION_DATA = dict(
            start_perf_time=time.perf_counter(),
            nodes_start_perf_time={},
            nodes_start_vram_time={}
        )

    origin_func(self, event=event, data=data, sid=sid)

    if event == "executing" and data and CURRENT_START_EXECUTION_DATA:
        if data.get("node") is None:
            if sid is not None:
                start_perf_time = CURRENT_START_EXECUTION_DATA.get('start_perf_time')
                new_data = data.copy()
                if start_perf_time is not None:
                    execution_time = time.perf_counter() - start_perf_time
                    new_data['execution_time'] = int(execution_time * 1000)
                origin_func(
                    self,
                    event="TyDev-Utils.ExecutionTime.execution_end",
                    data=new_data,
                    sid=sid
                )
        else:
            node_id = data.get("node")
            CURRENT_START_EXECUTION_DATA['nodes_start_perf_time'][node_id] = time.perf_counter()
            CURRENT_START_EXECUTION_DATA['nodes_start_vram_time'][node_id] = model_management.get_free_memory()


server.PromptServer.send_sync = swizzle_send_sync
