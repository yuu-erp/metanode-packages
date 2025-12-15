/**
 *  A **TransactionLike** is an object which is appropriate as a loose
 *  input for many operations which will populate missing properties of
 *  a transaction.
 */
export interface TransactionLike<A = string> {
  /**
   *  The type.
   */
  type?: null | number;
  /**
   *  The recipient address or ``null`` for an ``init`` transaction.
   */
  to?: null | A;

  /**
   *  The sender.
   */
  from?: null | A;
}
