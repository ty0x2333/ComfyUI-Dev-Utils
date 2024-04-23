import itertools as IT
import os
import re
import tempfile
import urllib.parse
from pathlib import Path

import requests
from tqdm import tqdm

import comfy
import folder_paths


class UrlDownload:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "url": ("STRING", {"default": ""}),
                "filename_prefix": ("STRING", {"default": "TyDev"}),
            },
            "optional": {
                "save_file": ("BOOLEAN", {"default": True}),
            }
        }

    RETURN_TYPES = (
        "STRING",
    )

    RETURN_NAMES = ("file_path",)

    FUNCTION = "doit"

    CATEGORY = "TyDev-Utils/Utils"

    @staticmethod
    def uniquify(path, sep='-'):
        """https://stackoverflow.com/a/13852851"""

        def name_sequence():
            count = IT.count()
            yield ''
            while True:
                yield '{s}{n:d}'.format(s=sep, n=next(count))

        orig = tempfile._name_sequence
        with tempfile._once_lock:
            tempfile._name_sequence = name_sequence()
            path = os.path.normpath(path)
            dirname, basename = os.path.split(path)
            filename, ext = os.path.splitext(basename)
            fd, filename = tempfile.mkstemp(dir=dirname, prefix=filename, suffix=ext)
            tempfile._name_sequence = orig
        return filename

    def doit(self, url: str, filename_prefix: str, save_file: bool = True):
        if save_file:
            output_dir = folder_paths.get_output_directory()
        else:
            output_dir = folder_paths.get_temp_directory()

        parse_result = urllib.parse.urlparse(url)
        url_path = Path(parse_result.path)
        extension = Path(parse_result.path).suffix.removeprefix('.')
        extension = re.sub('!.*$', '', extension)

        full_output_folder, filename, _, _, _ = folder_paths.get_save_image_path(filename_prefix, output_dir)

        output_filename = f"{filename}-{url_path.stem}"
        if extension:
            output_filename += f".{extension}"

        output_file_path = os.path.join(full_output_folder, output_filename)
        output_file_path = self.uniquify(output_file_path)

        block_size = 4096  # 4 KB
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            total = int(r.headers.get('content-length', 0))
            pbar = comfy.utils.ProgressBar(total)
            current = 0
            with tqdm.wrapattr(
                    open(output_file_path, 'wb'),
                    "write",
                    miniters=1,
                    desc=url.split('/')[-1],
                    total=total
            ) as fout:
                for chunk in r.iter_content(chunk_size=block_size):
                    fout.write(chunk)
                    current += len(chunk)
                    pbar.update_absolute(value=current)

        return (output_file_path,)
