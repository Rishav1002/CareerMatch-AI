"""
Test runner for CareerMatch AI.
Runs test_basic.py using pytest if available, or a lightweight fixture runner.
"""

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
        sys.exit(pytest.main(["tests/test_basic.py"]))
    except ImportError:
        pass

    # Fallback to direct inspection runner
    import tests.test_basic as tb

    test_functions = [
        (name, func)
        for name, func in inspect.getmembers(tb, inspect.isfunction)
        if name.startswith("test_")
    ]

    print(f"Running {len(test_functions)} tests in tests/test_basic.py...")
    passed = 0
    failed = 0

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
            passed += 1
        except Exception as exc:
            print(f"  [FAIL] {name}: {exc}")
            failed += 1
            mp.undo()

    print(f"\nResults: {passed} passed, {failed} failed.")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
