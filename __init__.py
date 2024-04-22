from .nodes.url_download import UrlDownload
from .nodes.upload_anything import UploadAnything

# A dictionary that contains all nodes you want to export with their names
# NOTE: names should be globally unique
NODE_CLASS_MAPPINGS = {
    "UrlDownload": UrlDownload,
    "UploadAnything": UploadAnything
}

# A dictionary that contains the friendly/humanly readable titles for the nodes
NODE_DISPLAY_NAME_MAPPINGS = {
    "UrlDownload": "Url Download",
    "UploadAnything": "Upload Anything"
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
