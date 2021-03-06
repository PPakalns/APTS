#!/usr/bin/env python3

import os
import stat
import zipfile
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Read config
from configparser import ConfigParser
CONFIG = ConfigParser()
CONFIG.read('config.cfg')
JDIR = CONFIG['Internal']['JDIR']
os.makedirs(JDIR, exist_ok=True)

import isolate
import result


def compile(config):
    logger.debug("Starting compilation of lang:%s, path: %s", config["lang"], config["source"])
    if config["lang"] == "cpp11":
        compiler = isolate.Cpp11(config["source"], config["executable"])
    elif config["lang"] == "cpp":
        compiler = isolate.Cpp(config["source"], config["executable"])
    elif config["lang"] == "c11":
        compiler = isolate.C11(config["source"], config["executable"])
    elif config["lang"] == "c":
        compiler = isolate.C(config["source"], config["executable"])
    elif config["lang"] == "fpc":
        compiler = isolate.FPC(config["source"], config["executable"])
    else:
        # Use default
        logger.debug("Lang does not match any provided compilator, lang: %s", config['lang'])
        compiler = isolate.Cpp11(config['source'], config['executable'])

    sandbox = isolate.Isolate(compiler.config)
    compile_result = compiler.compile(sandbox)
    sandbox.cleanUp()
    return compile_result


def ExecuteTest(test, isolate_config, wdir):
    logger.debug("Starting test of %s, input: %s", test["solution"], test["input"])
    sandbox = isolate.Isolate(isolate_config)

    solution_isolated_path = sandbox.copyTo(test["solution"], "solution")
    os.chmod(solution_isolated_path, stat.S_IXUSR) # Add permissions to execute file
    if test["use_files"]:
        sandbox.copyTo(test["input"], test["input_file"])
        sandbox.createFileIfNotExists(isolate_config.stdin_file)
        sandbox.createFileIfNotExists(test["output_file"])
    else:
        sandbox.copyTo(test["input"], isolate_config.stdin_file)
    test_result = sandbox.run(["solution"])

    # If user program did not exit correctly
    if test_result['return_code']!=0:
        logger.debug(test_result)
        return result.TestResult(
            test['id'],
            test_result.get('status'),
            public = test_result.get('message'),
            private = test_result.get('output'),
            stderr = test_result.get('stderr'),
            memorykb = test_result.get('max-rss') or 0,
            time = test_result.get('time'),
            visible = test['visible']
        )

    output_file = os.path.join(wdir, "output.file")
    if test["use_files"]:
        sandbox.createFileIfNotExists(test["output_file"]) # Create empty output file
        sandbox.copyFrom(test["output_file"], output_file)
    else:
        sandbox.copyFrom(isolate_config.stdout_file, output_file)
    sandbox.cleanUp()

    sandbox = isolate.Isolate(isolate.IsolateConfig().initChecker())
    sandbox.copyTo(test["input"], "input")
    sandbox.copyTo(output_file, "output")
    sandbox.copyTo(test["output"], "answer")
    checker_isolated_path = sandbox.copyTo(test["checker"], "checker")
    os.chmod(checker_isolated_path, stat.S_IXUSR)
    cres = sandbox.run(["checker", "input", "output", "answer"])
    sandbox.cleanUp()

    # If checker failed incorrectly
    if (cres["return_code"] not in [0,1]
       or (cres["return_code"]==1
           and ('killed' in cres or 'exitsig' in cres))):
        logger.error("Checker failed %s", cres)
        return result.TestResult(
            test["id"],
            'IE2',
            public = "Internal error",
            private = "Checker: " + cres.get('message', "") + "\n" + cres.get('stderr', ""),
            memorykb = test_result.get('max-rss'),
            time = test_result.get('time'),
            visible = test['visible'],
            stderr = test_result.get('stderr')
        )

    tr_exit_code = result.translate(cres['exitcode']) if 'exitcode' in cres else 'OK'

    return result.TestResult(
        test["id"],
        tr_exit_code,
        public = cres.get('stderr'),
        private = cres.get('message', "") + cres.get('stdout', ""),
        memorykb = int(test_result.get('max-rss')),
        time = test_result.get('time'),
        visible = test['visible'],
        stderr = test_result.get('stderr')
    )


def Tests(zip, tests, wdir):

    def Extract(filename, path):
        logger.debug("Extracting file %s to path %s", filename, path)
        return zf.extract(filename, path)

    extract_dir = os.path.join(wdir, "extract_dir")
    os.makedirs(extract_dir, exist_ok=True)

    logger.debug("Opening zip file for test extraction %s", zip)
    with zipfile.ZipFile(zip, 'r') as zf:
        for test in tests:
            try:
                test['input_path'] = Extract(test["in"], extract_dir)
                test['output_path'] = Extract(test["out"], extract_dir)
                test['extracted'] = True
                yield test

            except KeyError as e:
                yield {
                    "id"         : test['id'],
                    "extracted"  : False,
                    "private"    : str(e)
                }

class Task:

    def __init__(self, config, results):
        self.wdir = JDIR # Use judge temporary directory
        self.zip = config['zip']
        self.checker = config['checker']
        self.lang = config['lang']
        self.solution = config['solution']
        self.time_limit = config['time_limit']
        self.memory_limit = config['memory_limit']
        self.tests = config['tests']

        self.use_files = config['use_files']
        self.input_file = config['input_file']
        self.output_file = config['output_file']

        self.results = results # see result.py


    def __call__(self):

        # Compile checker
        checker_conf = {'lang': 'cpp11', 'source': self.checker, "executable": os.path.join(self.wdir, "checker")}
        checker_result = compile(checker_conf)

        if checker_result["return_code"]!=0:
            logger.warning("Checker compilation failed %s " % checker_result)
            self.results.setCheckerCEFail(checker_result)
            return

        # Compile user solution
        solution_conf = {"lang": self.lang, "source": self.solution, "executable": os.path.join(self.wdir, "solution")}
        solution_result = compile(solution_conf)

        if solution_result["return_code"]!=0:
            self.results.setCompileError(solution_result)
            logger.info("User solution compile error %s", self.lang)
            return

        self.results.userSolutionCompiled(solution_result)

        test_config = isolate.IsolateConfig().initSolution(self.memory_limit, self.time_limit)

        for test in Tests(self.zip, self.tests, self.wdir):

            if not test['extracted']:
                test_result = result.TestResult(test['id'], 'IE1', private=test["private"], visible=True)
                self.results.appendTestResult(test_result)
                continue

            config = {
                "id": test["id"],
                "solution": solution_result["executable"],
                "checker": checker_result["executable"],
                "input": test["input_path"],
                "output": test["output_path"],
                "visible": test["visible"],

                "use_files": self.use_files,
                "input_file": self.input_file,
                "output_file": self.output_file
            }

            test_result = ExecuteTest(config, test_config, self.wdir)
            logger.debug("%s", test_result.getResult())
            self.results.appendTestResult(test_result)

        logging.info(self.results)
        return self.results

