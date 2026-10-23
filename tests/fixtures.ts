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
