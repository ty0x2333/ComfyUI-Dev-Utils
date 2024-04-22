import hashlib
import os

import folder_paths


# modified from https://stackoverflow.com/questions/22058048/hashing-a-file-in-python
def calculate_file_hash(filename: str, hash_every_n: int = 1):
    # Larger video files were taking >.5 seconds to hash even when cached,
    # so instead the modified time from the filesystem is used as a hash
    h = hashlib.sha256()
    h.update(filename.encode())
    h.update(str(os.path.getmtime(filename)).encode())
    return h.hexdigest()


# Reference: https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite/blob/main/videohelpersuite/load_video_nodes.py
class UploadAnything:
    @classmethod
    def INPUT_TYPES(s):
        input_dir = folder_paths.get_input_directory()
        files = []
        for f in os.listdir(input_dir):
            if os.path.isfile(os.path.join(input_dir, f)):
                files.append(f)
        return {
            "required": {
                "file": (sorted(files),),
            },
        }

    CATEGORY = "TyDev-Utils/utils"

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("file_path",)

    FUNCTION = "upload"

    def upload(self, file):
        file_path = folder_paths.get_annotated_filepath(file)
        return (file_path,)

    @classmethod
    def IS_CHANGED(s, file, **kwargs):
        file_path = folder_paths.get_annotated_filepath(file)
        return calculate_file_hash(file_path)

    @classmethod
    def VALIDATE_INPUTS(s, file, **kwargs):
        if not folder_paths.exists_annotated_filepath(file):
            return "Invalid file: {}".format(file)
        return True
