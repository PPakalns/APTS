#!/usr/bin/env python3

import sys
import os
import shutil

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../"))
import isolate

TESTS = [
    {"source": "long_compile_time.cpp", "return_code": 1},
    {"source": "error.cpp", "return_code": 1},
    {"source": "sort.cpp", "return_code": 0}
]

EXECUTABLE_PATH = "executable"

for test in TESTS:
    path = os.path.join("sources", test["source"])

    compiler = isolate.Cpp11(path, EXECUTABLE_PATH)
    sandbox = isolate.Isolate(compiler.config)
    compile_result = compiler.compile(sandbox)
    sandbox.cleanUp()

    print(compile_result)
    if compile_result["return_code"] != test["return_code"]:
        raise Exception("Return code for test %s does not match. Expected %d, Recieved %d" % (test["return_code"], compile_result["return_code"]))
