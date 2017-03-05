#!/usr/bin/env python3

import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../"))
import task

TESTS = [
    {
        "checker": "sources/wcmp.cpp",
        "submission": "sources/m_logN.cpp",
        "zip": "sources/M_tests.zip",
        "lang": "cpp11",
        "time_limit": 1.24,
        "memory_limit": 256,
        "exp_status": "OK"
    }
]


for test in TESTS:
    tester = task.Task(test)

    result = tester()

    if result["status"] != test["exp_status"]:
        raise Exception("Expected status doesn't match. Expected: %s, Recieved: %s"
                        % (test["exp_status"], result["status"]))
