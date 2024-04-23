import time

import execution


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


origin_recursive_execute = execution.recursive_execute


def swizzle_origin_recursive_execute(server, prompt, outputs, current_item, extra_data, executed, prompt_id, outputs_ui,
                                     object_storage):
    unique_id = current_item
    class_type = prompt[unique_id]['class_type']
    last_node_id = server.last_node_id
    start_time = time.perf_counter()
    result = origin_recursive_execute(server, prompt, outputs, current_item, extra_data, executed, prompt_id,
                                      outputs_ui,
                                      object_storage)
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    if server.client_id is not None and last_node_id != server.last_node_id:
        server.send_sync("TyDev-Utils.ExecutionTime.executed",
                         {"node": unique_id, "prompt_id": prompt_id, "execution_time": int(execution_time * 1000)},
                         server.client_id)
    print(f"#{unique_id} [{class_type}]: {end_time - start_time:.2f}s")
    return result


execution.recursive_execute = swizzle_origin_recursive_execute
