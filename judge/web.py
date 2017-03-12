#!/usr/bin/env python3

import urllib
import requests
from requests.packages.urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

import os
import time

import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class JudgeApi:

    def __init__(self, base_url, judge_name, judge_pass):
        self.base_url = base_url
        self.auth = (judge_name, judge_pass)

        self.sess = requests.Session()

        # Setup network connectivity problem strategy
        retries = Retry(total=20,
                        connect=20,
                        read=20,
                        backoff_factor=0.1,
                        status_forcelist=[ 500, 502, 503, 504 ])

        self.sess.mount('http://', HTTPAdapter(max_retries=retries))


    def _url(self, path):
        return urllib.parse.urljoin(self.base_url, path)


    def _get(self):
        url = self._url('get')
        logger.debug("Getting submission %s", url)
        return self.sess.get(url, auth=self.auth)


    def _submit(self, result):
        url = self._url('submit')
        logger.debug("Submitting judge result %s", url)
        return self.sess.post(url, auth=self.auth, json=result)


    def _download(self, id, target_path):
        url = self._url('download/%d' % id)
        logger.debug("Downloading file %d form %s", id, url)
        start = time.time()
        try:
            with open(target_path, 'wb') as handle:
                response = self.sess.get(url, stream=True, auth=self.auth)

                if not response.ok:
                    return False

                for block in response.iter_content(1024):
                    handle.write(block)
        except:
            os.remove(target_path)
            return False

        end = time.time()
        logger.debug("Downloaded in %f", end-start)
        return target_path


    def downloadFile(self, id, name, dir, suffix="", cache=False):
        if id is None:
            return False
        filename = name + suffix
        target_path = os.path.join(dir, filename)
        if cache:
            if os.path.isfile(target_path):
                logger.debug("Found cache for file %s with id: %d , suffix: '%s'", target_path, id, suffix)
                return target_path
        return self._download(id, target_path)


    def submitResult(self, result):
        """
        Submits result to server,
        returns true if successfully submited else false
        """
        resp = self._submit(result)
        if (resp.status_code != 200):
            logger.warn("Submit result received status code %d", resp.status_code)
            return False
        sub = resp.json()
        if sub["status"] == "ok":
            logger.debug("Judging result submitted successfully")
            return True
        logger.warn("Received bad status %s", sub["status"])
        return False


    def getSubmission(self):
        """
        Requests submission from server
        Returns submission object or False if not retrieved successfully
        """
        resp = self._get()
        if (resp.status_code != 200):
            logger.warn("Get submission received status code %d", resp.status_code)
            return False
        sub = resp.json()
        if sub["status"] == "ok":
            logger.debug("Received submission for judging %d", sub["submission"]["id"])
            return sub
        if sub["status"] == "wait":
            logger.debug("No submission to test")
            return False
        logger.warn("Received bad status %s", sub["status"])
        return False

