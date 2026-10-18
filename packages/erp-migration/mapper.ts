export interface CustomerMapping {
  phone: string;
  email?: string;
  name?: string;
  zone?: string;
}

export interface OrderMapping {
  date: string;
  amount: string;
  status: string;
  serviceType?: string;
}

export interface ImportMappings {
  customer: CustomerMapping;
  order?: OrderMapping;
}

export interface MappedRow {
  phone: string;
  email?: string;
  name?: string;
  zone?: string;
  order?: {
    orderDate: Date;
    amount: number;
    status: string;
    serviceType?: string;
  };
}

/**
 * Extracts LMMS-compatible fields from a raw row using the user-provided mapping.
 */
export function mapRow(
  raw: Record<string, unknown>,
  mapping: ImportMappings,
): { data: MappedRow; errors: string[] } {
  const errors: string[] = [];

  const phoneRaw = raw[mapping.customer.phone];
  const phone = phoneRaw ? String(phoneRaw) : '';
  if (!phone) errors.push('missing_phone');

  const email = mapping.customer.email && raw[mapping.customer.email]
    ? String(raw[mapping.customer.email]).toLowerCase()
    : undefined;
  
  const name = mapping.customer.name && raw[mapping.customer.name]
    ? String(raw[mapping.customer.name])
    : undefined;
    
  const zone = mapping.customer.zone && raw[mapping.customer.zone]
    ? String(raw[mapping.customer.zone])
    : undefined;

  let order: MappedRow['order'] = undefined;

  if (mapping.order) {
    const dateRaw = raw[mapping.order.date];
    const amountRaw = raw[mapping.order.amount];
    const statusRaw = raw[mapping.order.status];

    if (dateRaw && amountRaw && statusRaw) {
      const orderDate = new Date(String(dateRaw));
      const amount = Number(amountRaw);

      if (isNaN(orderDate.getTime())) errors.push('invalid_order_date');
      if (isNaN(amount)) errors.push('invalid_order_amount');

      if (errors.length === 0) {
        order = {
          orderDate,
          amount,
          status: String(statusRaw),
          serviceType: mapping.order.serviceType && raw[mapping.order.serviceType]
            ? String(raw[mapping.order.serviceType])
            : undefined,
        };
      }
    }
  }

  return {
    data: { phone, email, name, zone, order },
    errors,
  };
}
