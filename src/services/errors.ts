import type { WorkOrderIssue } from '../utils/workOrderCalc';

export class DuplicatePoNumberError extends Error {
  constructor(poNumber: string) {
    super(`PO number ${poNumber} already exists.`);
    this.name = 'DuplicatePoNumberError';
  }
}

export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Order ${id} could not be found.`);
    this.name = 'OrderNotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`An order in ${from} cannot move to ${to}.`);
    this.name = 'InvalidTransitionError';
  }
}

export class DuplicateWorkOrderNumberError extends Error {
  constructor(public readonly workOrderNumber: string) {
    super(`Work order number ${workOrderNumber} already exists.`);
    this.name = 'DuplicateWorkOrderNumberError';
  }
}

/** A PO number that is already used by another work order. */
export class PoInOtherWorkOrderError extends Error {
  constructor(
    public readonly poNumber: string,
    public readonly workOrderNumber: string,
  ) {
    super(`PO ${poNumber} is already in work order ${workOrderNumber}.`);
    this.name = 'PoInOtherWorkOrderError';
  }
}

export class WorkOrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Work order ${id} could not be found.`);
    this.name = 'WorkOrderNotFoundError';
  }
}

/** Thrown when the service re-checks the data and finds problems the form missed. */
export class WorkOrderValidationError extends Error {
  constructor(public readonly issues: readonly WorkOrderIssue[]) {
    super('The work order has invalid data.');
    this.name = 'WorkOrderValidationError';
  }
}
