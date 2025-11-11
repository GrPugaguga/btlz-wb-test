/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable('daily_tariffs', (table) => {
        table.increments('id').primary();
        table.date('date').notNullable().unique();
        table.string('dt_next_box').nullable();
        table.string('dt_till_max').nullable();
        table.timestamps(true, true); 
    });

    await knex.schema.createTable('warehouse_tariffs', (table) => {
        table.increments('id').primary();
        table.integer('daily_tariff_id').unsigned().notNullable();
        table.foreign('daily_tariff_id').references('id').inTable('daily_tariffs').onDelete('CASCADE');
        table.string('warehouse_name').notNullable();
        table.string('geo_name').notNullable();
        table.decimal('box_delivery_base', 10, 2).nullable();
        table.string('box_delivery_coef_expr').nullable();
        table.decimal('box_delivery_liter', 10, 2).nullable();
        table.decimal('box_delivery_marketplace_base', 10, 2).nullable();
        table.string('box_delivery_marketplace_coef_expr').nullable();
        table.decimal('box_delivery_marketplace_liter', 10, 2).nullable();
        table.decimal('box_storage_base', 10, 2).nullable();
        table.string('box_storage_coef_expr').nullable();
        table.decimal('box_storage_liter', 10, 2).nullable();
        table.timestamps(true, true);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.dropTable('warehouse_tariffs');
    await knex.schema.dropTable('daily_tariffs');
}
