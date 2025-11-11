/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("spreadsheets")
        .insert([{ spreadsheet_id: "1E9FSbGB_fMY63OVZCfSaz5H0hXTGl5l-TH51cZNe9xI" }])
        .onConflict(["spreadsheet_id"])
        .ignore();
}
