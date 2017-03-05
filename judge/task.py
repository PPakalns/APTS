#!/usr/bin/env python3

import os
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import isolate

def compile(config):
    logger.debug("Starting compilation of lang:%s, path: %s", config["lang"], config["source"])
    if config["lang"] == "cpp11":
        compiler = isolate.Cpp11(config["source"], config["executable"])
    sandbox = isolate.Isolate(compiler.config)
    compile_result = compiler.compile(sandbox)
    sandbox.cleanUp()
    return compile_result

class Test:
    def __init__(self):
        pass

class Task:
    def __init__(self, config):
        self.zip = config["zip"]
        self.checker = config["checker"]
        self.lang = config["lang"]
        self.submission = config["submission"]
        self.time_limit = config["time_limit"]
        self.memory_limit = config["memory_limit"]

    def __call__(self):
        task_result = {}

        checker_conf = {"lang": "cpp11", "source": self.checker, "executable": "checker"}
        checker_result = compile(checker_conf)

        if checker_result["return_code"]!=0:
            logger.warning(checker_result)
            task_result["status"] = "IE"
            return task_result

        submission_conf = {"lang": self.lang, "source": self.submission, "executable": "solution"}
        submission_result = compile(submission_conf)

        if submission_result["return_code"]!=0:
            task_result["status"] = "CE"
            task_result["message"] = submission_result.stderr
            return task_result

        return {
            "status" : "OK",
            "group" : [
                {
                    "name": "input.i00",
                    "result": [
                        {"a" : 1 }
                    ]
                }
            ]
        }
