/**
 *  A callback function called when a an event is triggered.
 */
export type Listener = (...args: Array<any>) => void;

/**
 *  An **EventEmitterable** behaves similar to an EventEmitter
 *  except provides async access to its methods.
 *
 *  An EventEmitter implements the observer pattern.
 */
export interface EventEmitterable<T> {
  /**
   *  Registers a %%listener%% that is called whenever the
   *  %%event%% occurs until unregistered.
   */
  on(event: T, listener: Listener): Promise<this>;

  /**
   *  Registers a %%listener%% that is called the next time
   *  %%event%% occurs.
   */
  once(event: T, listener: Listener): Promise<this>;

  /**
   *  Triggers each listener for %%event%% with the %%args%%.
   */
  emit(event: T, ...args: Array<any>): Promise<boolean>;

  /**
   *  Resolves to the number of listeners for %%event%%.
   */
  listenerCount(event?: T): Promise<number>;

  /**
   *  Resolves to the listeners for %%event%%.
   */
  listeners(event?: T): Promise<Array<Listener>>;

  /**
   *  Unregister the %%listener%% for %%event%%. If %%listener%%
   *  is unspecified, all listeners are unregistered.
   */
  off(event: T, listener?: Listener): Promise<this>;

  /**
   *  Unregister all listeners for %%event%%.
   */
  removeAllListeners(event?: T): Promise<this>;

  /**
   *  Alias for [[on]].
   */
  addListener(event: T, listener: Listener): Promise<this>;

  /**
   *  Alias for [[off]].
   */
  removeListener(event: T, listener: Listener): Promise<this>;
}
