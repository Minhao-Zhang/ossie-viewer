export const validYaml = `
version: 0.2.0.dev0
name: Demo
datasets:
  - name: orders
    source: db.orders
  - name: customers
    source: db.customers
relationships:
  - name: orders_to_customers
    from: orders
    to: customers
    from_columns: [customer_id]
    to_columns: [customer_id]
`;

export const invalidYaml = `
version: 0.2.0.dev0
name: Demo
datasets:
  - name: one
    source: s
  - name: two
    source: s
  - name: three
    source: s
    fields:
      - expression:
          dialects:
            - dialect: ANSI_SQL
              expression: amount
`;

export const detailYaml = `
version: 0.2.0.dev0
name: Shop
description: A small shop
ai_context: Prefer recent orders.
custom_extensions:
  - vendor_name: DEMO
    data: '{"warehouse":"ANALYTICS"}'
datasets:
  - name: orders
    source: db.orders
    primary_key: [order_id]
    unique_keys:
      - [order_number]
    description: Customer orders
    ai_context:
      instructions: Use for sales.
      synonyms: [purchases, tickets]
    custom_extensions:
      - vendor_name: SNOWFLAKE
        data: '{"schema":"PUBLIC"}'
    fields:
      - name: order_id
        expression:
          dialects:
            - dialect: ANSI_SQL
              expression: order_id
        datatype: Integer
        description: Order identifier
        ai_context: The primary key.
      - name: amount
        expression:
          dialects:
            - dialect: ANSI_SQL
              expression: amount
        description: Order amount
  - name: customers
    source: db.customers
    primary_key: [customer_id]
    fields:
      - name: customer_id
        expression:
          dialects:
            - dialect: ANSI_SQL
              expression: customer_id
        description: Customer identifier
relationships:
  - name: orders_to_customers
    from: orders
    to: customers
    from_columns: [customer_id]
    to_columns: [customer_id]
    ai_context:
      synonyms: [buyer]
metrics:
  - name: revenue
    description: Revenue per customer
    expression:
      dialects:
        - dialect: ANSI_SQL
          expression: SUM(orders.amount) / COUNT(DISTINCT customers.customer_id)
        - dialect: SNOWFLAKE
          expression: SUM(orders.amount)
    ai_context:
      synonyms: [sales]
`;

export const valid011 = {
  version: "0.1.1",
  semantic_model: [
    {
      name: "Demo",
      datasets: [
        { name: "orders", source: "db.orders" },
        { name: "customers", source: "db.customers" },
      ],
      relationships: [
        {
          name: "orders_to_customers",
          from: "orders",
          to: "customers",
          from_columns: ["customer_id"],
          to_columns: ["customer_id"],
        },
      ],
    },
  ],
};
