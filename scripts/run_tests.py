"""
Test runner for CareerMatch AI.
Discovers and runs all tests/test_*.py test files using pytest if available,
or a lightweight fixture inspection runner.
"""

import importlib
import inspect
import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


class SimpleMonkeyPatch:
    """Minimal pytest-compatible monkeypatch fixture."""

    def __init__(self):
        self._undo = []

    def setattr(self, target, name, value):
        old_val = getattr(target, name)
        self._undo.append((target, name, old_val))
        setattr(target, name, value)

    def undo(self):
        for target, name, old_val in reversed(self._undo):
            setattr(target, name, old_val)


def main():
    # If pytest is installed, try running it
    try:
        import pytest
        sys.exit(pytest.main(["tests"]))
    except ImportError:
        pass

    # Fallback to direct inspection runner across tests/
    tests_dir = os.path.join(ROOT_DIR, "tests")
    test_files = [
        f[:-3]
        for f in sorted(os.listdir(tests_dir))
        if f.startswith("test_") and f.endswith(".py")
    ]

    total_passed = 0
    total_failed = 0

    for mod_name in test_files:
        module = importlib.import_module(f"tests.{mod_name}")
        test_functions = [
            (name, func)
            for name, func in inspect.getmembers(module, inspect.isfunction)
            if name.startswith("test_")
        ]

        print(f"\nRunning {len(test_functions)} tests in tests/{mod_name}.py...")
        for name, func in test_functions:
            sig = inspect.signature(func)
            mp = SimpleMonkeyPatch()
            try:
                if "monkeypatch" in sig.parameters:
                    func(monkeypatch=mp)
                    mp.undo()
                else:
                    func()
                print(f"  [PASS] {name}")
                total_passed += 1
            except Exception as exc:
                print(f"  [FAIL] {name}: {exc}")
                total_failed += 1
                mp.undo()

    print(f"\nResults: {total_passed} passed, {total_failed} failed.")
    sys.exit(0 if total_failed == 0 else 1)


if __name__ == "__main__":
    main()
