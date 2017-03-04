import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../"))

import isolate
import shutil

sort_cpp = os.path.abspath(os.path.join(os.path.realpath(__file__), "../sources/sort.cpp"))
executable_path = os.path.abspath(os.path.join(os.path.realpath(__file__), "../executable"))

compiler = isolate.Cpp11(sort_cpp, executable_path)
sandbox = isolate.Isolate(compiler.config)

compile_result = compiler.compile(sandbox)
