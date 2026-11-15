import { Schema } from 'mongoose';
import { tenantContext } from '../utils/asyncLocalStorage';

export function tenantPlugin(schema: Schema) {
  schema.pre(/^find/, function (next) {
    const store = tenantContext.getStore();
    if (store && store.tenantId) {
      this.where({ tenantId: store.tenantId });
    }
    next();
  });

  schema.pre('save', function (next) {
    const store = tenantContext.getStore();
    if (store && store.tenantId && !(this as any).tenantId) {
      (this as any).tenantId = store.tenantId;
    }
    next();
  });
}