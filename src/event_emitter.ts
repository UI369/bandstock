interface Events {
  [key: string]: Function[];
}

export class EventEmitter {
    public events: Events;
    constructor(events?: Events) {
        this.events = events || {};
    }

  public subscribe(name: string, cb: Function) {
    console.log("subscribing: " + name);
    (this.events[name] || (this.events[name] = [])).push(cb);

    return {
      unsubscribe: () =>
        this.events[name] && this.events[name].splice(this.events[name].indexOf(cb) >>> 0, 1)
    };
  }

  public emit(name: string, ...args: any[]): void {
    console.log("emitting: " + name);
    (this.events[name] || []).forEach(fn => fn(...args));
    console.log('done')
  }
}
