import time

import execution
import server


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


PROMPT_START_EXECUTION_DATA = None

origin_recursive_execute = execution.recursive_execute


def swizzle_origin_recursive_execute(server, prompt, outputs, current_item, extra_data, executed, prompt_id, outputs_ui,
                                     object_storage):
    unique_id = current_item
    class_type = prompt[unique_id]['class_type']
    last_node_id = server.last_node_id
    result = origin_recursive_execute(server, prompt, outputs, current_item, extra_data, executed, prompt_id,
                                      outputs_ui,
                                      object_storage)
    if PROMPT_START_EXECUTION_DATA:
        start_time = PROMPT_START_EXECUTION_DATA['nodes_start_perf_time'].get(unique_id)
        if start_time:
            end_time = time.perf_counter()
            execution_time = end_time - start_time
            if server.client_id is not None and last_node_id != server.last_node_id:
                server.send_sync(
                    "TyDev-Utils.ExecutionTime.executed",
                    {"node": unique_id, "prompt_id": prompt_id, "execution_time": int(execution_time * 1000)},
                    server.client_id
                )
            print(f"#{unique_id} [{class_type}]: {execution_time:.2f}s")
    return result


execution.recursive_execute = swizzle_origin_recursive_execute

origin_func = server.PromptServer.send_sync


def swizzle_send_sync(self, event, data, sid=None):
    global PROMPT_START_EXECUTION_DATA
    if event == "execution_start":
        PROMPT_START_EXECUTION_DATA = dict(
            prompt_id=data["prompt_id"],
            start_perf_time=time.perf_counter(),
            nodes_start_perf_time={}
        )

    origin_func(self, event=event, data=data, sid=sid)

    if event == "executing" and data and PROMPT_START_EXECUTION_DATA and PROMPT_START_EXECUTION_DATA[
        "prompt_id"] == data.get("prompt_id"):
        if data.get("node") is None:
            if sid is not None:
                start_perf_time = PROMPT_START_EXECUTION_DATA.get('start_perf_time')
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
            PROMPT_START_EXECUTION_DATA['nodes_start_perf_time'][node_id] = time.perf_counter()


server.PromptServer.send_sync = swizzle_send_sync
