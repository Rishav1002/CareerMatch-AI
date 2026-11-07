"""
In-memory sliding window rate limiter for CareerMatch AI.
Thread-safe, self-cleaning, and lightweight with zero external dependencies.
"""

import threading
import time
from typing import Dict, List, Optional, Tuple


class SlidingWindowRateLimiter:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._records: Dict[str, List[float]] = {}
        self._last_cleanup = time.time()

    def _cleanup(self, now: float) -> None:
        if now - self._last_cleanup > 300:  # Clean every 5 minutes
            expired_keys = []
            for key, timestamps in self._records.items():
                self._records[key] = [t for t in timestamps if now - t < 3600]
                if not self._records[key]:
                    expired_keys.append(key)
            for k in expired_keys:
                del self._records[k]
            self._last_cleanup = now

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        now = time.time()
        with self._lock:
            self._cleanup(now)
            timestamps = self._records.get(key, [])
            cutoff = now - window_seconds
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= max_requests:
                retry_after = int(window_seconds - (now - valid_timestamps[0])) + 1 if valid_timestamps else window_seconds
                return False, max(1, retry_after)

            valid_timestamps.append(now)
            self._records[key] = valid_timestamps
            return True, 0

    def reset(self, key: Optional[str] = None) -> None:
        with self._lock:
            if key:
                self._records.pop(key, None)
            else:
                self._records.clear()


rate_limiter = SlidingWindowRateLimiter()
