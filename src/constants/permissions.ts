/**
 * Permission keys — must match backend; source of truth is GET /business/permissions/catalog (data.keys).
 * Used for route guards and UI checks only; API enforces access.
 */
export const P = {
  business: {
    profile: { view: "business.profile.view", update: "business.profile.update" },
    settings: { view: "business.settings.view", update: "business.settings.update" },
    business_types: {
      view: "business.business_types.view",
      manage: "business.business_types.manage",
    },
    industry_types: {
      view: "business.industry_types.view",
      manage: "business.industry_types.manage",
    },
    dashboard: { view: "business.dashboard.view" },
    team: {
      view: "business.team.view",
      invite: "business.team.invite",
      manage: "business.team.manage",
    },
    role_groups: { view: "business.role_groups.view", manage: "business.role_groups.manage" },
  },
  invoice: {
    create: "invoice.create",
    view: "invoice.view",
    update: "invoice.update",
    finalize: "invoice.finalize",
    cancel: "invoice.cancel",
    payment: { record: "invoice.payment.record" },
    communication: "invoice.communication",
    pdf: "invoice.pdf",
  },
  item: {
    create: "item.create",
    view: "item.view",
    update: "item.update",
    delete: "item.delete",
    stock: { view: "item.stock.view", manage: "item.stock.manage" },
    adjust_stock: "item.adjust_stock",
    unit: { manage: "item.unit.manage" },
    category: {
      create: "item.category.create",
      view: "item.category.view",
      update: "item.category.update",
      delete: "item.category.delete",
    },
  },
  party: {
    create: "party.create",
    view: "party.view",
    update: "party.update",
    delete: "party.delete",
    consignee: { manage: "party.consignee.manage" },
    ledger: { view: "party.ledger.view" },
    payment: { advance: "party.payment.advance" },
    statement: { view: "party.statement.view" },
  },
  credit_note: {
    create: "credit_note.create",
    view: "credit_note.view",
    update: "credit_note.update",
    delete: "credit_note.delete",
  },
  receipt: {
    create: "receipt.create",
    view: "receipt.view",
    update_allocations: "receipt.update_allocations",
    pdf: "receipt.pdf",
  },
  payment: {
    outbound: {
      create: "payment.outbound.create",
      view: "payment.outbound.view",
      pdf: "payment.outbound.pdf",
    },
  },
  reports: { view: "reports.view" },
  tax: { view: "tax.view" },
  alerts: { view: "alerts.view", manage: "alerts.manage" },
  audit: { view: "audit.view" },
} as const;
