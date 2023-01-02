/**
 * Self-adjusting interval to account for drifting
 *
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds)
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 */
export let scriptRunner = function AdjustingInterval(
  workFunc,
  script,
  errorFunc,
  doLog,
  logFunc,
  logLabel
) {
  let that = this;

  this.start = function () {
    script.forEach((element) => {
      setTimeout(workFunc, element.offset);
    });
  };

  this.stop = function () {
    clearTimeout(timeout);
  };

  function step() {
    console.log("step");
    let now = Date.now();
    let drift = now - expected;
    if (doLog) {
      logFunc(logLabel, now, expected, drift, that.interval, lastInterval);
    }

    if (drift > that.interval) {
      expected += that.interval;
      lastInterval = 1;
      timeout = setTimeout(step, Math.max(0, lastInterval));

      if (errorFunc) errorFunc(now, expected, drift, that.interval);
    } else {
      workFunc();

      expected += that.interval;
      lastInterval = that.interval - drift;
    }
  }
};
