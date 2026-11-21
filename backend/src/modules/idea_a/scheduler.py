import logging
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from datetime import date, datetime, time
from threading import Event, Thread
from zoneinfo import ZoneInfo

BANGKOK = ZoneInfo("Asia/Bangkok")
CHECK_TIME = time(15, 30)
logger = logging.getLogger(__name__)


class DailyCheck:
    def __init__(self, run: Callable[[datetime], object]) -> None:
        self._run = run
        self._last_attempt: date | None = None

    def tick(self, now: datetime) -> None:
        local_now = now.astimezone(BANGKOK)
        today = local_now.date()
        if local_now.time().replace(second=0, microsecond=0) != CHECK_TIME:
            return
        if self._last_attempt is not None and today <= self._last_attempt:
            return

        self._last_attempt = today
        try:
            self._run(now)
        except Exception:
            logger.exception("Idea A scheduled stock check failed for %s", today)


@contextmanager
def scheduled_checks(
    run: Callable[[datetime], object],
    *,
    clock: Callable[[], datetime] = lambda: datetime.now(BANGKOK),
) -> Iterator[None]:
    worker = DailyCheck(run)
    stopping = Event()

    def poll() -> None:
        while not stopping.is_set():
            worker.tick(clock())
            stopping.wait(timeout=1)

    thread = Thread(target=poll, name="idea-a-scheduler")
    thread.start()
    try:
        yield
    finally:
        stopping.set()
        thread.join()
