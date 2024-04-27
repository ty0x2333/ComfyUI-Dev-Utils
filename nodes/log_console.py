from __future__ import annotations

import asyncio
import io
import logging
import sys
from typing import Optional, List, Any

from aiohttp import web
from aiohttp_sse import sse_response, EventSourceResponse

from server import PromptServer


class SSEHandler:

    def __init__(self, client_id: Optional[str], console_id: Optional[str], response: EventSourceResponse):
        self.client_id = client_id
        self.console_id = console_id
        self.response = response

    @property
    def is_connected(self) -> bool:
        return self.response.is_connected()

    async def send(self, record: str):
        await self.response.send(data=record)


log_queue = asyncio.Queue()


class LogCatcher:
    RED = "\x1b[31;20m"
    RESET = "\x1b[0m"

    def __init__(self, obj: Any, attr_name: str, error: bool):
        self.obj = obj
        self.attr_name = attr_name
        self.error = error
        self.origin_value = None

    def start(self):
        self.origin_value = getattr(self.obj, self.attr_name)
        setattr(self.obj, self.attr_name, self)

    def stop(self):
        setattr(self.obj, self.attr_name, self.origin_value)
        self.origin_value = None

    def write(self, value):
        if value:
            if self.error:
                put_value = self.RED + value + self.RESET
            else:
                put_value = value
            log_queue.put_nowait(put_value)
        if self.origin_value:
            self.origin_value.write(value)

    def __getattr__(self, item):
        return getattr(self.origin_value, item)


LOG_CATCHERS: Optional[List[LogCatcher]] = None


class LogListener:
    _sentinel = None

    def __init__(self, queue: asyncio.Queue):
        self.queue = queue
        self.handlers: List[SSEHandler] = []
        self._task: Optional[asyncio.Task] = None

    @property
    def is_started(self) -> bool:
        return self._task is not None

    def start_if_needed(self):
        if self.is_started:
            return
        try:
            loop = asyncio.get_event_loop()
        except:  # noqa
            loop = asyncio.new_event_loop()

        self._task = loop.create_task(self._monitor())

    def append_handler(self, handler: SSEHandler):
        if not handler.is_connected:
            return
        print(f"[LogConsole] client [{handler.client_id}], console [{handler.console_id}], connected")
        self.handlers.append(handler)

    def __remove_disconnected_handler(self, handler: SSEHandler):
        print(f"[LogConsole] client [{handler.client_id}], console [{handler.console_id}], disconnected")
        self.handlers.remove(handler)

    async def handle(self, record):
        for handler in self.handlers[:]:
            if not handler.is_connected:
                self.__remove_disconnected_handler(handler)
                continue

            try:
                await handler.send(record)
            except ConnectionResetError:
                self.__remove_disconnected_handler(handler)

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
        if not self._task:
            return
        self._task.cancel()
        self._task = None


log_listener = LogListener(queue=log_queue)


def start_log_catchers_if_needed():
    global LOG_CATCHERS
    if LOG_CATCHERS is not None:
        return
    print("Start Log Catchers...")
    LOG_CATCHERS = []
    stdout_log_catcher = LogCatcher(sys, 'stdout', error=False)
    LOG_CATCHERS.append(stdout_log_catcher)
    stderr_log_catcher = LogCatcher(sys, 'stderr', error=True)
    LOG_CATCHERS.append(stderr_log_catcher)

    for handler in logging.root.handlers:
        if not isinstance(handler, logging.StreamHandler) or not handler.stream:
            continue

        if handler.stream.__class__.__name__ == 'ComfyUIManagerLogger':
            if getattr(handler.stream, 'is_stdout'):
                error = False
            else:
                error = True
            LOG_CATCHERS.append(LogCatcher(handler, 'stream', error=error))
            continue

        if isinstance(handler.stream, io.TextIOWrapper):
            if handler.stream.name == '<stdout>':
                LOG_CATCHERS.append(LogCatcher(handler, 'stream', error=False))
            elif handler.stream.name == '<stderr>':
                LOG_CATCHERS.append(LogCatcher(handler, 'stream', error=True))

    for catcher in LOG_CATCHERS:
        catcher.start()


def stop_log_catchers_if_needed():
    global LOG_CATCHERS
    if LOG_CATCHERS is None:
        return
    print("Stop Log Catchers...")
    for catcher in LOG_CATCHERS:
        catcher.stop()
    LOG_CATCHERS = None


@PromptServer.instance.routes.get("/ty-dev-utils/log")  # noqa
async def log_stream(request: web.Request) -> web.StreamResponse:
    client_id = request.query.get('client_id')
    console_id = request.query.get('console_id')
    log_listener.start_if_needed()
    start_log_catchers_if_needed()

    async with sse_response(request) as resp:
        log_listener.append_handler(SSEHandler(response=resp, client_id=client_id, console_id=console_id))
        while resp.is_connected():
            await asyncio.sleep(1)

    return resp


@PromptServer.instance.routes.post("/ty-dev-utils/disable-log")  # noqa
async def disable_log_stream(request: web.Request) -> web.StreamResponse:
    client_id = request.query.get('client_id')
    console_id = request.query.get('console_id')
    print(f"Disable Log Console. client id: {client_id}, console id: {console_id}")
    log_listener.stop()
    stop_log_catchers_if_needed()

    return web.json_response({'code': 0})
