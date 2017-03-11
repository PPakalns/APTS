
import copy
from enum import Enum

class Status(Enum):
    WAIT = 0
    TESTING = 1
    OK = 2
    CE = 3
    IE1 = 16 # Download error
    IE2 = 17 # CHECKER

# Test result status codes

EXIT_CODE_MAP = {
    'OK' : 0,
    'WA' : 1,
    'PE' : 2,
    'FAIL' : 3,
    'DIRT' : 4,
    'UNEXPECTED_EOF' : 8,
    'IE1' : 16, # - Zip copy fail
    'IE2' : 17, # - Checker runtime fail
    'RE': 32, # — run-time error, i.e., exited with a non-zero exit code
    'SG': 33, # — program died on a signal
    'TO': 34, # — timed out
    'XX': 35, # — internal error of the sandbox
    'UNKNOWN': 64
}

EXIT_TO_STATUS_MAP = {v: k for k, v in EXIT_CODE_MAP.items() }

"""
Translates checker exit code to status message
"""
def translate(code):
    if code in EXIT_TO_STATUS_MAP:
        return EXIT_TO_STATUS_MAP[code]
    else:
        return 'UNKNOWN'

"""
Stores one test result
"""
class TestResult:

    def __init__(self, id, status_code, public = "", private = "", memory = 0, time = 0):
        self.id = id
        self.status_code = status_code
        self.public = public
        self.private = private
        self.memory = memory
        self.time = time
        self.score = 1 if status_code == 0 else 0


    def result(self):
        return {
            id: self.id,
            status: self.status_code,
            public: self.public,
            private: self.private,
            memory: self.memory,
            time: self.time,
            score: self.score
        }


"""
Stores task test result
"""
class Result:

    def __init__(self, submission_id, testset_id):
        self.submission_id = submission_id
        self.testset_id = testset_id
        self.maxmemory = 0
        self.maxtime = 0.0
        self.status = 0
        self.tests = []
        self.maxscore = 0
        self.score = 0
        self.public = ""
        self.private = ""


    def appendTestResult(self, test_result):
        self.maxtime = max(self.maxtime, test_result.time)
        self.maxmemory = max(self.maxmemory, test_result.memory)
        self.maxscore += 1
        self.score += test_result.score
        self.tests.append(test_result)


    def setDownloadFail(self, private=""):
        self.status = Status.IE1
        self.private = private

    def setCheckerCEFail(self, run_result):
        self.status = Status.IE2
        self.public = "Test set incorrect"
        self.private = run_result.get('stderr', default="") + " " + run_result.get('output', default=" ")


    def setCompileError(self, run_result):
        self.status = Status.CE
        self.public = run_result.get('stderr')
        self.private = run_result.get('output')


    def getTestResult():
        return [test.result() for test in self.tests]


    def result(self):
        return {
            status: self.status,
            submission_id: self.submission_id,
            testset_id: self.testset_id,
            score: self.score,
            maxscore: self.maxscore,
            maxtime: self.maxtime,
            maxmemory: self.maxmemory,
            public: self.public,
            private: self.private,
            tests: self.getTestResult()
        }

