const fetch = require('node-fetch');

module.exports = function(google_sheet, google_api_key, cache_duration, should_transpose_values=true) {
    let cached_data = "{}";
    let cached_time = -1;

    async function get_data() {
        const raw_data = await get_raw_data();
        const { data, headers, rows } = parse_data(raw_data);
        
        return { 
            raw_data,
            data,
            headers,
            rows,
            google_sheet
        };
    }

    async function get_single(template_name, variation_name) {
        const { data } = await get_data();

        return data[template_name][variation_name];
    }

    async function get_raw_data() {
        const now = Date.now();

        if (cached_data && (now - cached_time) <  cache_duration) {
            return cached_data;
        } 

        const google_spreadsheet_query = `EmailTemplates!A1:AZ1000`;
        const google_spreadsheet_url = `https://sheets.googleapis.com/v4/spreadsheets/${google_sheet}/values/${google_spreadsheet_query}?key=${google_api_key}`;

        const res = await fetch(google_spreadsheet_url);
        const body = await res.text();

        cached_data = body;
        cached_time = now;

        return body;
    }

    function clean_google_data(data) {
        return data.replace(/\\n/g, '');
    }

    function transpose(a) {
        // Calculate the width and height of the Array
        var w = a.length || 0;
        var h = a[0] instanceof Array ? a[0].length : 0;

        // In case it is a zero matrix, no transpose routine needed.
        if (h === 0 || w === 0) { return []; }

        var i, j, t = [];

        // Loop through every item in the outer array (height)
        for (i = 0; i < h; i++) {

            // Insert a new row (array)
            t[i] = [];

            // Loop through every item per item in outer array (width)
            for (j = 0; j < w; j++) {

                // Save transposed data.
                t[i][j] = a[j][i];
            }
        }

        return t;
    }

    function parse_data(data) {
        const json = JSON.parse(clean_google_data(data));

        if (should_transpose_values) {
            json.values = transpose(json.values);
        }

        json.values.shift();

        var headers = ['ID', ...json.values.shift()];
        var result = {};
        var rows = [];

        var row_index = 1;
        for (var row of json.values) {
            var col_index = 1;
            var named_row = { id: row_index++ };
            for (var col of row) {
                named_row[headers[col_index++].toLowerCase()] = col;
            }

            var template = result[named_row.template_name];
            if (!template) {
                template = {};
                result[named_row.template_name] = template;
            }
            template[named_row.variation_name] = named_row;
            rows.push(named_row);
        }

        return { data: result, headers, rows };
    }

    return {
        get_raw_data,
        get_data,
        get_single,
        parse_data,
    };
}
