const fetch = require('node-fetch');

module.exports = function(google_sheet, google_api_key, cache_duration) {
    let cached_data = "{}";
    let cached_time = -1;

    async function get_send_list() {
        const raw_data = await get_raw_data();
        const { send_list, headers } = parse_send_list(raw_data);
        
        return { 
            //raw_data,
            send_list,
            headers,
            google_sheet
        };
    }

    async function get_single(template_name, variation_name) {
        const { send_list } = await get_send_list();

        return send_list[template_name][variation_name];
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

    function parse_send_list(data) {
        const json = JSON.parse(clean_google_data(data));

        json.values.shift();
        var headers = ['ID', ...json.values.shift()];
        var result = {};

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
        }

        return { send_list: result, headers };
    }

    return {
        get_raw_data,
        get_send_list,
        get_single,
        parse_send_list,
    };
}
