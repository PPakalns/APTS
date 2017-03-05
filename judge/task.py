#!/usr/bin/env python3

import os
import stat
import re
import zipfile
import logging
logging.basicConfig(level=logging.INFO)
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

def ExecuteTest(solution_path, checker_path, input_path, output_path, wdir, config):
    logger.debug("Starting test of %s, input: %s", solution_path, input_path)
    sandbox = isolate.Isolate(config)

    solution_isolated_path = sandbox.copyTo(solution_path, "solution")
    os.chmod(solution_isolated_path, stat.S_IXUSR)
    sandbox.copyTo(input_path, config.stdin_file)
    test_result = sandbox.run(["solution"])

    print(test_result)

    if test_result["return_code"]==1:
        return {
            "status" : test_result["status"],
            "public" : test_result["message"],
            "score"  : 0
        }
    elif test_result["return_code"]!=0:
        return {
            "status"  : "IE",
            "public"  : "Internal error",
            "private" : test_result["message"],
            "score"   : 0
        }

    output_file = os.path.join(wdir, "output.file")
    sandbox.copyFrom(config.stdout_file, output_file)
    sandbox.cleanUp()

    sandbox = isolate.Isolate(isolate.IsolateConfig().initChecker())
    sandbox.copyTo(input_path, "input")
    sandbox.copyTo(output_file, "output")
    sandbox.copyTo(output_path, "answer")
    checker_isolated_path = sandbox.copyTo(checker_path, "checker")
    os.chmod(checker_isolated_path, stat.S_IXUSR)
    cres = sandbox.run(["checker", "input", "output", "answer"])
    sandbox.cleanUp()

    if cres["return_code"] not in [0, 1]:
        return {
            "status"  : "IE",
            "public"  : "Internal error",
            "private" : cres["message"] if "message" in cres else "",
            "score"   : 0
        }

    print(cres)
    return {
        "status"  : "OK" if cres["return_code"]==0 else cres["status"],
        "public"  : cres["stderr"],
        "private" : "",
        "score"   : 1 if cres["return_code"]==0 else 0
    }

def Tests(zip, wdir):

    def Extract(filename, path):
        logger.debug("Extracting file %s to path %s", filename, path)
        return zf.extract(filename, path)

    logger.debug("Reading tests from zipfile %s", zip)
    pattern = re.compile(r"\.i(\d+\w?)$")
    with zipfile.ZipFile(zip, 'r') as zf:
        for info in zf.infolist():
            if pattern.search(info.filename):
                input_filename = info.filename
                output_filename = pattern.sub(r".o\g<1>", info.filename)

                dir = os.path.join(wdir, "tests")

                input_path = Extract(input_filename, dir)
                output_path = Extract(output_filename, dir)

                yield {
                    "name"       : info.filename,
                    "input_path" : input_path,
                    "output_path": output_path
                }


class Task:
    def __init__(self, config):
        self.wdir = "tmpdata"
        os.makedirs(self.wdir, exist_ok=True)

        self.zip = config["zip"]
        self.checker = config["checker"]
        self.lang = config["lang"]
        self.submission = config["submission"]
        self.time_limit = config["time_limit"]
        self.memory_limit = config["memory_limit"]

    def __call__(self):
        result = {
            "status": "OK",
            "tests": []
        }

        checker_conf = {"lang": "cpp11", "source": self.checker, "executable": os.path.join(self.wdir, "checker")}
        checker_result = compile(checker_conf)

        if checker_result["return_code"]!=0:
            logger.warning(checker_result)
            result["status"] = "IE"
            result["private"] = checker_result["stderr"]
            return result

        submission_conf = {"lang": self.lang, "source": self.submission, "executable": os.path.join(self.wdir, "solution")}
        submission_result = compile(submission_conf)

        if submission_result["return_code"]!=0:
            result["status"] = "CE"
            result["public"] = submission_result["stderr"]
            return task_result

        test_config = isolate.IsolateConfig()
        test_config.address_space = self.memory_limit
        test_config.timeout = self.time_limit
        test_config.extra_timeout = 0.5

        result["total_score"] = 0
        result["total_tests"] = 0

        for test in Tests(self.zip, self.wdir):
            test_result = ExecuteTest(
                submission_result["executable"],
                checker_result["executable"],
                test["input_path"],
                test["output_path"],
                self.wdir,
                test_config
            )
            result["tests"].append(test_result)
            result["total_score"] += test_result["score"]
            result["total_tests"] += 1

        return result

