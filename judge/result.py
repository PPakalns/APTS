
import copy
from enum import Enum

TASK_STATUS_MAP = {
    'WAIT'    : 0,
    'TESTING' : 1,
    'OK'      : 2,
    'CE'      : 3,
    'IE1'     : 16, # Download error
    'IE2'     : 17, # CHECKER
}

# Test result status codes

EXIT_CODE_MAP = {
    'OK'             : 0,
    'WA'             : 1,
    'PE'             : 2,
    'FAIL'           : 3,
    'DIRT'           : 4,
    'UNEXPECTED_EOF' : 8,
    'IE1'            : 16, # - Zip copy fail
    'IE2'            : 17, # - Checker runtime fail
    'RE'             : 32, # — run-time error, i.e., exited with a non-zero exit code
    'SG'             : 33, # — program died on a signal
    'TO'             : 34, # — timed out
    'XX'             : 35, # — internal error of the sandbox
    'UNKNOWN'        : 64
}


"""
Translates checker exit code to status message
"""
def translate(code):
    code = int(code)
    if code in EXIT_TO_STATUS_MAP:
        return EXIT_TO_STATUS_MAP[code]
    else:
        return 'UNKNOWN'

"""
Stores one test result
"""
class TestResult:

    def __init__(self, id, status_code, public = "", private = "", memorykb = 0, time = 0):
        self.id = id
        self.status_code = status_code
        self.public = public
        self.private = private
        self.memory = int(memorykb) * 1024
        self.time = float(time)
        self.score = 1 if status_code == 'OK' else 0


    def getResult(self):
        return {
            'test_id': self.id,
            'status': self.status_code,
            'public': self.public,
            'private': self.private,
            'memory': self.memory,
            'time': self.time,
            'score': self.score
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
        self.status = TASK_STATUS_MAP['OK']
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
        self.status = TASK_STATUS_MAP['IE1']
        self.private = private

    def setCheckerCEFail(self, run_result):
        self.status = TASK_STATUS_MAP['IE2']
        self.public = "Test set incorrect"
        self.private = run_result.get('stderr', default="") + " " + run_result.get('output', default=" ")


    def userSolutionCompiled(self, run_result):
        self.public = run_result.get('stderr') + run_result.get('stdout')
        self.private = run_result.get('output')


    def setCompileError(self, run_result):
        self.status = TASK_STATUS_MAP['CE']
        self.userSolutionCompiled(run_result)


    def getTestResult(self):
        return [test.getResult() for test in self.tests]


    def getResult(self, with_tests=True):
        return {
            'status': self.status,
            'submission_id': self.submission_id,
            'testset_id': self.testset_id,
            'score': self.score,
            'maxscore': self.maxscore,
            'maxtime': self.maxtime,
            'maxmemory': self.maxmemory,
            'public': self.public,
            'private': self.private,
            'tests': self.getTestResult() if with_tests else None
        }

    def __str__(self):
        return str(self.getResult(with_tests=False))


