#!/usr/bin/env python3

import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../"))
import task

TESTS = [
    {
        "checker": "sources/wcmp.cpp",
        "submissions": [
            {"source": "sources/m_slov.cpp", "exp_status": "OK" },
            {"source": "sources/m_wa.cpp", "exp_status": "OK"},
            {"source": "sources/m_exit.cpp", "exp_status": "OK" },
            {"source": "sources/m_logN.cpp", "exp_status": "OK" }
        ],
        "zip": "sources/m_tests.zip",
        "lang": "cpp11",
        "time_limit": 1.24,
        "memory_limit": 256 * 1024,
    }
]


for test in TESTS:
    for submission in test["submissions"]:
        test["submission"] = submission["source"]
        test["exp_status"] = submission["exp_status"]
        tester = task.Task(test)

        result = tester()

        print(result)

        if result["status"] != test["exp_status"]:
            raise Exception("Expected status doesn't match. Expected: %s, Recieved: %s"
                            % (test["exp_status"], result["status"]))
