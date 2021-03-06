#!/usr/bin/env python3

import subprocess
import os

import logging
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ISOLATE_PATH = "/usr/local/bin/isolate"

def runIsolate(params):
    params = [ISOLATE_PATH] + params

    logger.debug("Running isolate with params (%s)", " ".join(params))

    proc = subprocess.Popen(params,stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = proc.communicate()
    return_code = proc.wait()

    if len(err):
        logger.debug("Isolate error: %s", err)

    out = out.decode().strip()
    logger.debug("Isolate exit code %d\tReturned string: \"%s\"", return_code, out);
    return (return_code, out)

class IsolateConfig:
    def __init__(self):
                # Default parameters for isolate
        self.box_id = None                # -b
        self.cgroup = False            # --cg
        self.cgroup_space = None       # --cg-mem
        self.cgroup_time = False
        self.chdir = "/box"            # --chdir
        self.dirs = []                 # -dir
        self.preserve_env = False      # -e
        self.inherit_env = []          # --env
        self.set_env = {"PATH":"/usr/bin"} # --env
        self.fsize = 128*1024          # -f
        self.stack_space = None        # -k
        self.address_space = None      # -m
        self.max_processes = 1         # -p
        self.timeout = None            # --time
        self.verbosity = 0             # -v
        self.wallclock_timeout = 100   # -w
        self.extra_timeout = None      # -x

        self.stdin_file = "stdin.log"         # -i
        self.stdout_file = "stdout.log"        # -o
        self.stderr_file = "stderr.log"        # -r

        self.meta_file = "run.meta"    # --meta

        self.isolate_dir = None

        #Python support
        self.set_env["HOME"] = "./"

    def initChecker(self):
        self.timeout = 10
        self.address_space = 512 * 1024
        self.wallclock_timeout = max(self.timeout * 10, 10)
        self.stdin_file = None
        return self

    def initSolution(self, memory_limit, time_limit):
        self.address_space = memory_limit
        self.timeout = time_limit
        self.extra_timeout = 0.3
        self.wallclock_timeout = max(self.timeout * 10, 10)
        return self

    def getInitOptions(self):
        opt = []
        if self.cgroup:
            opt += ["--cg"]
        opt += ["--verbose"] * self.verbosity
        opt += ["--init"]
        return opt

    def inner_absolute_path(self, filename):
        return (os.path.join("/box", filename));

    def getRunOptions(self):
        opt = []
        if self.box_id is not None:
            opt += ["--box-id=%d" % self.box_id]
        if self.cgroup:
            opt += ["--cg"]
            if self.cgroup_space is not None:
                opt += ["--cg-mem=%d" % self.cgroup_space]
            if self.cgroup_time:
                opt += ["--cg-timing"]
        if self.chdir is not None:
            opt += ["--chdir=%s" % self.chdir]
        for in_name, out_name, options in self.dirs:
            s = in_name
            if out_name is not None:
                s += "=" + out_name
            if options is not None:
                s += ":" + options
            opt += ["--dir=%s" % s]
        if self.preserve_env:
            opt += ["--full-env"]
        for var in self.inherit_env:
            opt += ["--env=%s" % var]
        for var, value in self.set_env.items():
            opt += ["--env=%s=%s" % (var, value)]
        if self.fsize is not None:
            opt += ["--fsize=%d" % self.fsize]
        if self.stdin_file is not None:
            opt += ["--stdin=%s" % self.inner_absolute_path(self.stdin_file)]
        if self.stack_space is not None:
            opt += ["--stack=%d" % self.stack_space]
        if self.address_space is not None:
            opt += ["--mem=%d" % self.address_space]
        if self.stdout_file is not None:
            opt += ["--stdout=%s" % self.inner_absolute_path(self.stdout_file)]
        if self.cgroup:
            if self.max_processes is not None:
                opt += ["--processes=%d" % self.max_processes]
            else:
                opt += ["--processes"]
        if self.stderr_file is not None:
            opt += ["--stderr=%s" % self.inner_absolute_path(self.stderr_file)]
        if self.timeout is not None:
            opt += ["--time=%g" % self.timeout]
        opt += ["--verbose"] * self.verbosity
        if self.wallclock_timeout is not None:
            opt += ["--wall-time=%g" % self.wallclock_timeout]
        if self.extra_timeout is not None:
            opt += ["--extra-time=%g" % self.extra_timeout]
        opt += ["--meta=%s" % self.meta_file]
        opt += ["--run", "--"]
        return opt

    def getCleanupOptions(self):
        opt = []
        opt += ["--verbose"] * self.verbosity
        opt += ["--cleanup"]
        return opt

class Isolate:
    def __init__(self, config):
        logger.debug("Creating sandbox")

        self.config = config
        ret_code, self.config.isolate_dir = runIsolate(self.config.getInitOptions())

        self.cleaned = False

        if ret_code != 0:
            self.cleaned = True
            raise Exception("Internal error," +
                            "could not initialize isolate enviroment with params %s"
                            % " ".join(self.config.getInitOptions()))

        self.config.isolate_dir = os.path.abspath(self.config.isolate_dir)

        if os.path.isdir(self.config.isolate_dir) == False:
            raise Exception("Isolated directory '%s' is not a directory" % self.config.isolate_dir)

    def getSandboxBoxDir(self):
        return os.path.join(self.config.isolate_dir, "box")

    def getSandboxDir(self):
        return self.config.isolate_dir

    def readFile(self, file):
        trunc = 10000
        output = b""
        logger.log(logging.DEBUG, "Reading file %s", file)
        with open(file, 'rb') as f:
            while trunc > 0:
                byte_s = f.read(trunc)
                output += byte_s
                trunc -= len(byte_s)
                if not byte_s:
                    break
        return output.decode('latin-1')

    def readStdOut(self):
        file = os.path.join(self.getSandboxBoxDir(), self.config.stdout_file)
        return self.readFile(file)

    def readStdErr(self):
        file = os.path.join(self.getSandboxBoxDir(), self.config.stderr_file)
        return self.readFile(file)

    def cleanUp(self):
        self.cleaned = True
        runIsolate(self.config.getCleanupOptions())

    def copyTo(self, src, filename):
        rdst = os.path.join("box", filename)
        dst = os.path.join(self.config.isolate_dir, rdst)
        logger.debug("Copying file from '%s' to '%s'", src, dst)
        shutil.copyfile(src, dst)
        return dst

    def copyFrom(self, bsrc, dst):
        src = os.path.join(self.config.isolate_dir, "box", bsrc)
        logger.debug("Copying file from '%s' to '%s'", src, dst)
        shutil.copyfile(src, dst)

    def createFileIfNotExists(self, filename):
        path = os.path.join(self.config.isolate_dir, "box", filename)
        if not os.path.exists(path):
            open(path, 'w').close()

    def run(self, params):
        params = self.config.getRunOptions() + params
        return_code, output = runIsolate(params)
        run_result = {
            "return_code" : return_code,
            "output" : output,
            "stdout" : self.readStdOut(),
            "stderr" : self.readStdErr()
        }
        run_result.update(self.parseMetaFile())
        return run_result

    def parseMetaFile(self):
        logger.debug("Reading meta file %s", self.config.meta_file)
        opt = {}
        with open(self.config.meta_file, "r") as ins:
            for line in ins:
                key, value = line.split(":")
                opt[key] = value.strip()
        return opt

    def __del__(self):
        if self.cleaned==None or not self.cleaned:
            self.cleanUp()


class Compiler:
    def __init__(self, file, targetpath):
        self.config = IsolateConfig()
        self.config.cgroup = True
        self.config.cgroup_space = 1024*1024
        self.config.cgroup_time = True
        self.config.timeout = 20
        self.config.max_processes = 30
        self.config.address_space = 1024*1024
        self.config.stdin_file = None

        self.file = file
        self.targetpath = targetpath

    def source(self):
        return "source.cpp"

    def executable(self):
        return "executable"

    def command(self):
        raise Exception("Not implemented")

    def compile(self, sandbox):
        sandbox.copyTo(self.file, self.source())
        compile_result = sandbox.run(self.command())

        if compile_result["return_code"] == 0:
            sandbox.copyFrom(self.executable(), self.targetpath)
            compile_result["executable"] = self.targetpath

        return compile_result

class Cpp11(Compiler):
    def command(self):
        return ["/usr/bin/g++", "-DEVAL", "-static", "-O2", "-std=c++11", "-o", self.executable(), self.source()]

class Cpp(Compiler):
    def command(self):
        return ["/usr/bin/g++", "-DEVAL", "-static", "-O2", "-o", self.executable(), self.source()]

class C11(Compiler):
    def command(self):
        return ["/usr/bin/gcc", "-DEVAL", "-static", "-O2", "-std=c11", "-o", self.executable(), self.source(), "-lm"]

class C(Compiler):
    def command(self):
        return ["/usr/bin/gcc", "-DEVAL", "-static", "-O2", "-o", self.executable(), self.source(), "-lm"]

class FPC(Compiler):
    def command(self):
        return ["/usr/local/bin/fpc", "-dEVAL", "-XS", "-O2", "-o%s" % self.executable(), self.source()]

