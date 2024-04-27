from __future__ import annotations

import asyncio
import io
import logging
import sys
from typing import Optional, List

from aiohttp import web
from aiohttp_sse import sse_response, EventSourceResponse

from server import PromptServer

# TODO: Test
COUNTER = 0


class SSEHandler:

    def __init__(self, client_id: Optional[str], response: EventSourceResponse):
        self.client_id = client_id
        self.response = response

    @property
    def is_connected(self) -> bool:
        return self.response.is_connected()

    async def send(self, record: str):
        await self.response.send(data=record)


log_queue = asyncio.Queue()


class LogCatcher:

    def __init__(self, stream_name: str):
        self.stream_name = stream_name
        self.origin_stream = None

    def start(self):
        self.origin_stream = getattr(sys, self.stream_name)
        setattr(sys, self.stream_name, self)

    def stop(self):
        setattr(sys, self.stream_name, self.origin_stream)
        self.origin_stream = None

    def write(self, value):
        if value:
            log_queue.put_nowait(value)
        self.origin_stream.write(value)

    def __getattr__(self, item):
        return getattr(self.origin_stream, item)


stdout_log_catcher = LogCatcher('stdout')

stderr_log_catcher = LogCatcher('stderr')


class LogListener:
    _sentinel = None

    def __init__(self, queue: asyncio.Queue):
        self.queue = queue
        self.handlers: List[SSEHandler] = []
        self._task: Optional[asyncio.Task] = None

    def start(self):
        if self._task:
            return
        try:
            loop = asyncio.get_event_loop()
        except:
            loop = asyncio.new_event_loop()

        self._task = loop.create_task(self._monitor())

    def append_handler(self, handler: SSEHandler):
        if not handler.is_connected:
            return
        print(f"log handler, client [{handler.client_id}] connected")
        self.handlers.append(handler)

    async def handle(self, record):
        def removeDisconnectedHandler(handler: SSEHandler):
            print(f"log handler, client [{handler.client_id}] disconnected")
            self.handlers.remove(handler)

        for handler in self.handlers[:]:
            if not handler.is_connected:
                removeDisconnectedHandler(handler)
                continue

            try:
                await handler.send(record)
            except ConnectionResetError:
                removeDisconnectedHandler(handler)

    async def _monitor(self):
        q = self.queue
        while True:
            try:
                record = await self.queue.get()
                await self.handle(record)
                q.task_done()
            except Exception as e:
                print(f"QueueListener._monitor fail: {e}")

    def stop(self):
        if self._task:
            self._task.cancel()


log_listener = LogListener(queue=log_queue)


# TODO: TEST
@PromptServer.instance.routes.get("/ty-dev-utils/put")
async def put_log(request: web.Request) -> web.StreamResponse:
    global COUNTER
    stdout_log_catcher.write(f"Hello {COUNTER}")
    COUNTER += 1
    return web.json_response({"code": 0})


@PromptServer.instance.routes.get("/ty-dev-utils/log")
async def log_stream(request: web.Request) -> web.StreamResponse:
    client_id = request.query.get('client_id')
    async with sse_response(request) as resp:
        log_listener.append_handler(SSEHandler(response=resp, client_id=client_id))
        while resp.is_connected():
            await asyncio.sleep(1)

    return resp


log_listener.start()

stdout_log_catcher.start()
stderr_log_catcher.start()

for handler in logging.root.handlers:
    if not isinstance(handler, logging.StreamHandler) or not handler.stream:
        continue

    if handler.stream.__class__.__name__ == 'ComfyUIManagerLogger':
        handler.stream = stderr_log_catcher
        continue

    if isinstance(handler.stream, io.TextIOWrapper):
        if handler.stream.name == '<stdout>':
            handler.stream = stdout_log_catcher
        elif handler.stream.name == '<stderr>':
            handler.stream = stderr_log_catcher
