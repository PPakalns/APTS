#!/usr/bin/env python3

from configparser import ConfigParser
import signal
import time
import os

import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import web
import task
import result

# Stop judge safely with signal

def signal_handler(signal, frame):
    global interrupted
    interrupted = True

interrupted = False  # Program is interrupted
signal.signal(signal.SIGINT, signal_handler)


# Read config
config = ConfigParser()
config.read('config.cfg')

# Create working directory
WDIR = config['Internal']['WDIR']
SDIR = config['Internal']['SDIR']
os.makedirs(WDIR, exist_ok=True)
os.makedirs(SDIR, exist_ok=True)

# Create storage directory
SDIR = config['Internal']['SDIR']
os.makedirs(SDIR, exist_ok=True)

# Initialize api
judge_api = web.JudgeApi(config['Api']['url'], config['Judge']['name'], config['Judge']['pass'])


def goodSleep(seconds):
    for _ in range(int(seconds)):
        if interrupted:
            return
        time.sleep(1)


def judgeSubmission():
    """
    Judge a submission
    if there are no submission to judge return false else return true
    """
    internal_error = False

    sub = judge_api.getSubmission()

    if not sub:
        return False

    logger.info("Judging solution %d", sub['submission']['id'])

    # Downloading files
    downloads = {
        "checker": (sub["checker_id"], "checker", WDIR),
        "solution": (sub["submission"]["solution_id"], "solution", WDIR),
        "zip": (sub["zip_id"], str(sub["zip_id"]), SDIR, ".zip", True)
    }

    results = result.Result(sub['submission']['id'], sub['testset_id'] )

    test_params = {
        'lang': sub['submission']['type'],
        'time_limit': sub['time_limit'],
        'memory_limit': int(sub['memory_limit'])*1024,

        # Downloaded files
        'checker': None,
        'solution': None,
        'zip': None,

        'tests': sub['tests']
    }

    for name, params in downloads.items():
        file_path = judge_api.downloadFile(*params)
        test_params[name] = file_path
        if not file_path:
            logger.error("File download failed with params %s", str(params))
            results.setDownloadFail("File download failed %s", name)
            internal_error = True
            break


    if internal_error:
        logger.error("Internal error")
        return False


    submission_judge = task.Task(test_params, results)
    submission_judge()

    judge_api.submitResult(results.getResult())
    return True


def main():
    while True:
        if interrupted:
            logger.info("Judge stopped by SIGINT signal")
            break

        # Get submission
        if not judgeSubmission():
            goodSleep(config['Internal']['sleep'])


if __name__ == "__main__":
    main()
else:
    raise Exception("judge.py is not module")

