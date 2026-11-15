import { Schema } from 'mongoose';
import { tenantContext } from '../utils/asyncLocalStorage';

export function tenantPlugin(schema: Schema) {
  schema.pre(/^find/, function (this: any, next: () => void) {
    const store = tenantContext.getStore();
    if (store && store.tenantId) {
      this.where({ tenantId: store.tenantId });
    }
    next();
  });

  schema.pre('countDocuments', function (this: any, next: () => void) {
    const store = tenantContext.getStore();
    if (store && store.tenantId) {
      this.where({ tenantId: store.tenantId });
    }
    next();
  });

  schema.pre('save', function (this: any, next: () => void) {
    const store = tenantContext.getStore();
    if (store && store.tenantId && !this.tenantId) {
      this.tenantId = store.tenantId;
    }
    next();
  });
}