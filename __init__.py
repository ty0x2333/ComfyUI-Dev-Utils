from .nodes.url_download import UrlDownload
from .nodes.upload_anything import UploadAnything
from .nodes.execution_time import ExecutionTime
from .nodes.log_console import *

# A dictionary that contains all nodes you want to export with their names
# NOTE: names should be globally unique
NODE_CLASS_MAPPINGS = {
    "TY_UrlDownload": UrlDownload,
    "TY_UploadAnything": UploadAnything,
    "TY_ExecutionTime": ExecutionTime
}

# A dictionary that contains the friendly/humanly readable titles for the nodes
NODE_DISPLAY_NAME_MAPPINGS = {
    "TY_UrlDownload": "Url Download",
    "TY_UploadAnything": "Upload Anything",
    "TY_ExecutionTime": "Execution Time"
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
